import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { Feature, TestArtifact, TestLayer } from '../types';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const apiKey = process.env.AI_API_KEY;
const baseURL = process.env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/';
const modelName = process.env.AI_MODEL_NAME || 'glm-4-plus';

let aiClient: OpenAI | null = null;
if (apiKey && apiKey !== 'your_key_here') {
    aiClient = new OpenAI({ apiKey, baseURL });
    console.log(`[AI] Initialized with model ${modelName} at ${baseURL}`);
}

// ─── System Prompt ───

const SYSTEM_PROMPT = `You are Trellis — an expert system for test traceability and coverage optimization.

You understand the testing pyramid deeply:
- UNIT tests: fast (< 100ms), cheap, test isolated functions/classes. Frameworks: Jest, Vitest, Mocha.
- API/INTEGRATION tests: medium speed (100ms-2s), test HTTP endpoints, database queries, service interactions. Frameworks: Supertest, Axios-based, Pactum.
- E2E tests: slow (5-30s), expensive, test full user flows through a browser. Frameworks: Playwright, Cypress, Puppeteer.

Cross-layer correlation signals you look for:
- Shared domain concepts: "login", "checkout", "password validation" across layers
- Shared API endpoints: unit test mocks /auth/login, API test calls /auth/login, E2E test navigates to login page
- Shared UI selectors: unit test renders <LoginForm>, E2E test clicks [data-testid="login-button"]
- Shared assertions: unit checks isValid(), API checks status 200, E2E checks "Welcome" text
- Describe block hierarchy: tests under the same describe("Login") likely test the same behavior
- File path proximity: tests in auth/__tests__/ relate to tests in e2e/auth/

You think in terms of BEHAVIOR SCENARIOS — what the user does, not what the code does:
- GOOD scenario: "User logs in with valid credentials"
- BAD scenario: "AuthService unit tests" (this is a technical grouping, not a behavior)
- GOOD scenario: "System rejects expired session tokens"
- BAD scenario: "Token validation tests" (too vague, not user-centric)

You always respond in valid JSON when asked.`;

// ─── Helpers ───

export function cosineSimilarity(vecA: number[], vecB: number[]) {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class AIService {
    isAIEnabled(): boolean {
        return !!aiClient;
    }

    private async chat(prompt: string, jsonMode = false): Promise<string> {
        if (!aiClient) return '';
        try {
            const completion = await aiClient.chat.completions.create({
                model: modelName,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: prompt },
                ],
                ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
            });
            return completion.choices[0].message.content || '';
        } catch (error) {
            console.error('[AI] Chat failed:', error);
            return '';
        }
    }

    // ─── Embeddings (not available on z.ai, skip gracefully) ───

    async getEmbedding(_text: string): Promise<number[]> {
        return [];
    }

    // ─── Test Intent Summarization ───

    async summarizeTestIntent(testBody: string): Promise<string> {
        if (!this.isAIEnabled()) return testBody;
        const result = await this.chat(
`Analyze this test code and extract what USER-VISIBLE BEHAVIOR it verifies.

Test Code:
\`\`\`
${testBody.substring(0, 1500)}
\`\`\`

Return a single sentence in this format:
"Verifies that [who] can [do what] [under what conditions] [with what expected outcome]"

Examples:
- "Verifies that a user can log in with valid email and password and receives a session token"
- "Verifies that the system rejects login attempts with an incorrect password and returns 401"
- "Verifies that the submit button is disabled while the login request is in progress"

Focus on:
1. WHO is the actor (user, system, admin)
2. WHAT action they perform
3. WHAT is the expected outcome or assertion
4. Any edge case or precondition being tested

Do NOT describe implementation details like "calls function X" or "mocks service Y".
Return ONLY the single sentence, nothing else.`
        );
        return result || testBody;
    }

    // ─── Scenario Inference ───

    async inferScenarios(featureName: string, tests: { name: string; layer: string; filepath: string; body?: string }[]): Promise<{
        title: string;
        summary: string;
        testIndices: number[];
        confidence: number;
    }[]> {
        if (!this.isAIEnabled() || tests.length === 0) return [];

        const testList = tests.map((t, i) => {
            let entry = `[${i}] layer=${t.layer} | "${t.name}" | file: ${t.filepath}`;
            if (t.body) {
                const snippet = t.body.substring(0, 300).replace(/\n/g, ' ').trim();
                entry += `\n     code: ${snippet}`;
            }
            return entry;
        }).join('\n');

        const prompt = `Analyze these tests for the "${featureName}" feature and group them into behavior scenarios.

TESTS:
${testList}

TASK: Group these ${tests.length} tests into behavior scenarios based on what USER BEHAVIOR they collectively verify.

Cross-layer grouping rules:
- A unit test that validates email format + an API test that rejects invalid email + an E2E test that shows email error = ONE scenario: "System validates email format"
- Tests that share the same API endpoint (e.g. POST /auth/login) across layers should be in the same scenario
- Tests that test the SAME user action but at different layers belong together
- Tests under the same describe() block LIKELY belong to the same scenario (but not always)
- A single E2E test often maps to multiple unit+API tests that cover the same flow

Naming rules:
- Title must describe the USER BEHAVIOR: "User logs in with valid credentials" not "Login tests"
- Use active voice: "User submits...", "System rejects...", "Admin configures..."
- Be specific: "User sees error for empty password" not "Error handling"
- One scenario = one distinct user action or system response

Confidence scoring:
- 0.9-1.0: Tests explicitly share endpoints, selectors, or domain terms across layers
- 0.7-0.89: Tests are in the same describe block or test the same concept
- 0.5-0.69: Tests seem related by file proximity or keyword overlap
- 0.3-0.49: Weak signal, test could belong elsewhere

Respond in JSON:
{
  "scenarios": [
    {
      "title": "Behavior-level scenario title",
      "summary": "What this scenario covers and why these tests belong together",
      "testIndices": [0, 3, 7],
      "confidence": 0.85
    }
  ]
}

IMPORTANT:
- Every test index (0 to ${tests.length - 1}) must appear in exactly one scenario
- Aim for 2-7 scenarios. If there are fewer than 5 tests, 2-3 scenarios is fine
- Cross-layer scenarios (unit+api or unit+api+e2e) are MORE valuable than single-layer groups
- If two tests at the same layer check the same thing, note it — they may be redundant`;

        const result = await this.chat(prompt, true);
        if (!result) return [];

        try {
            const parsed = JSON.parse(result);
            return parsed.scenarios || [];
        } catch {
            console.error('[AI] Failed to parse scenario inference result');
            return [];
        }
    }

    // ─── Cross-layer Link Suggestion ───

    async suggestLinks(scenarioTitle: string, tests: { id: string; name: string; layer: string; body?: string }[]): Promise<{
        testId: string;
        confidence: number;
        rationale: string;
        linkType: 'verifies' | 'partially_verifies' | 'duplicates';
    }[]> {
        if (!this.isAIEnabled() || tests.length === 0) return [];

        const testList = tests.map(t => {
            let entry = `- ID:${t.id} (${t.layer}) "${t.name}"`;
            if (t.body) entry += `\n  code: ${t.body.substring(0, 200).replace(/\n/g, ' ')}`;
            return entry;
        }).join('\n');

        const prompt = `Determine how each test relates to this behavior scenario.

SCENARIO: "${scenarioTitle}"

TESTS:
${testList}

For each test, determine:

1. linkType:
   - "verifies" — this test DIRECTLY validates the scenario behavior. The test would fail if this behavior broke.
   - "partially_verifies" — this test covers a SUBSET of the scenario (e.g. tests only the validation, not the full flow).
   - "duplicates" — this test checks the SAME thing as another test in this list, at the same or different layer. Flag redundancy.

2. confidence (0.0-1.0):
   - How sure are you this test belongs to this scenario?
   - High (0.8+): test name/assertions directly reference the scenario behavior
   - Medium (0.5-0.8): test is related but could belong elsewhere
   - Low (<0.5): weak connection

3. rationale:
   - Explain in 1 sentence WHY this test is linked. Reference specific signals:
     "Shares POST /auth/login endpoint with API test"
     "Validates same email format rule as unit test"
     "E2E flow covers the same login behavior end-to-end"
     "Tests same assertion (status 401) as [other test name]"

Respond in JSON:
{
  "links": [
    {
      "testId": "the-test-id",
      "confidence": 0.85,
      "rationale": "Specific explanation referencing shared signals",
      "linkType": "verifies"
    }
  ]
}`;

        const result = await this.chat(prompt, true);
        if (!result) return [];

        try {
            const parsed = JSON.parse(result);
            return parsed.links || [];
        } catch {
            console.error('[AI] Failed to parse link suggestion result');
            return [];
        }
    }

    // ─── Gap Analysis ───

    async analyzeGaps(scenarioTitle: string, layers: { unit: number; api: number; e2e: number }): Promise<{
        type: string;
        severity: string;
        summary: string;
        recommendation: string;
    }[]> {
        if (!this.isAIEnabled()) return [];

        const prompt = `Analyze test coverage for this behavior scenario and identify meaningful gaps.

SCENARIO: "${scenarioTitle}"
CURRENT COVERAGE:
- Unit tests: ${layers.unit}
- API/Integration tests: ${layers.api}
- E2E tests: ${layers.e2e}

Apply the testing pyramid principle:
- Unit layer should have the MOST tests (fast, cheap, isolated logic)
- API layer should cover key integrations (endpoints, DB queries, auth flows)
- E2E layer should have the FEWEST tests (slow, expensive, only critical user paths)

Gap types to look for:

1. "missing_layer" — A layer has zero tests but the scenario NEEDS coverage there.
   - No unit tests for validation logic that gets tested only in E2E = HIGH severity
   - No E2E test for a non-critical feature = LOW severity (not everything needs E2E)
   - No API test when there IS an API endpoint being tested = MEDIUM severity

2. "redundancy" — The same check exists at multiple expensive layers.
   - Password validation checked in both unit AND E2E = can remove from E2E
   - Same HTTP status assertion in both API and E2E = E2E one is redundant

3. "expensive_e2e" — E2E tests cover logic that should be at a cheaper layer.
   - Form validation in E2E → should be unit
   - API response format in E2E → should be API test

4. "weak_assertion" — A layer has tests but they may not be thorough.
   - 1 unit test for complex validation logic = probably insufficient
   - Only happy-path tested, no error cases

Respond in JSON:
{
  "gaps": [
    {
      "type": "missing_layer" | "redundancy" | "expensive_e2e" | "weak_assertion",
      "severity": "high" | "medium" | "low",
      "summary": "Specific, actionable description of the gap",
      "recommendation": "Concrete next step to fix it (e.g. 'Add unit test for email validation in AuthService.validateEmail()')"
    }
  ]
}

IMPORTANT:
- Only return REAL gaps. Do not invent problems.
- If coverage looks balanced (some unit + some api, or unit + e2e), return fewer or no gaps.
- Be specific in recommendations — reference the scenario behavior, not generic advice.
- Maximum 3 gaps per scenario. Prioritize the most impactful ones.`;

        const result = await this.chat(prompt, true);
        if (!result) return [];

        try {
            const parsed = JSON.parse(result);
            return parsed.gaps || [];
        } catch {
            return [];
        }
    }

    // ─── Layer Detection (heuristic, no AI needed) ───

    detectLayer(testName: string, filePath: string): TestLayer {
        const lower = (testName + filePath).toLowerCase();
        if (lower.includes('e2e') || lower.includes('playwright') || lower.includes('cypress')) return 'e2e';
        if (lower.includes('api') || lower.includes('supertest') || lower.includes('.spec.')) return 'api';
        return 'unit';
    }
}
