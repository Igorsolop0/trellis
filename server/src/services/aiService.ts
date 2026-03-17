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
                messages: [{ role: 'user', content: prompt }],
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
            `Summarize what this test verifies in one sentence. Focus on the user behavior being tested.\n\nTest Code:\n${testBody.substring(0, 1000)}\n\nReturn ONLY the summary.`
        );
        return result || testBody;
    }

    // ─── Scenario Inference (Phase 2 — now real) ───

    async inferScenarios(featureName: string, tests: { name: string; layer: string; filepath: string; body?: string }[]): Promise<{
        title: string;
        summary: string;
        testIndices: number[];
        confidence: number;
    }[]> {
        if (!this.isAIEnabled() || tests.length === 0) return [];

        const testList = tests.map((t, i) =>
            `[${i}] (${t.layer}) ${t.name} — file: ${t.filepath}`
        ).join('\n');

        const prompt = `You are a test traceability expert. Given a feature and its tests, group them into behavior scenarios.

Feature: "${featureName}"

Tests:
${testList}

Group these tests into 2-7 behavior scenarios. Each scenario describes ONE user behavior (e.g. "User logs in with valid credentials", "Invalid password shows error").

Respond in JSON:
{
  "scenarios": [
    {
      "title": "Human-readable behavior scenario title",
      "summary": "One sentence explaining what this behavior covers",
      "testIndices": [0, 3, 5],
      "confidence": 0.85
    }
  ]
}

Rules:
- Every test must appear in exactly one scenario
- Scenario titles should describe USER BEHAVIOR, not technical details
- Confidence: 0.9+ if tests clearly relate, 0.5-0.8 if inferred, <0.5 if uncertain
- If a test doesn't fit any group, create a single-test scenario with low confidence`;

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

        const testList = tests.map(t =>
            `- ID:${t.id} (${t.layer}) "${t.name}"`
        ).join('\n');

        const prompt = `Given a behavior scenario and a list of tests, determine how each test relates to the scenario.

Scenario: "${scenarioTitle}"

Tests:
${testList}

For each test, respond in JSON:
{
  "links": [
    {
      "testId": "the-test-id",
      "confidence": 0.85,
      "rationale": "Short explanation of why this test verifies/duplicates this scenario",
      "linkType": "verifies"
    }
  ]
}

linkType options:
- "verifies" — test directly validates this behavior
- "partially_verifies" — test covers part of this behavior
- "duplicates" — test overlaps with another test in this scenario`;

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

        const prompt = `Analyze test coverage gaps for a behavior scenario.

Scenario: "${scenarioTitle}"
Coverage: ${layers.unit} unit tests, ${layers.api} API tests, ${layers.e2e} E2E tests

Identify specific gaps and provide actionable recommendations.

Respond in JSON:
{
  "gaps": [
    {
      "type": "missing_layer" | "redundancy" | "expensive_e2e" | "weak_assertion",
      "severity": "high" | "medium" | "low",
      "summary": "Clear description of the gap",
      "recommendation": "Specific action to fix it"
    }
  ]
}

Only return real, meaningful gaps. If coverage looks good, return empty array.`;

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
