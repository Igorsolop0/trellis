// ─── Types ───

export type TestType = 'behavior' | 'implementation' | 'non_functional';

export type TestTypeSignals =
    | 'e2e_layer'
    | 'ui_selectors'
    | 'page_objects'
    | 'component_render'
    | 'http_status'
    | 'user_centric_name'
    | 'user_interaction'
    | 'navigation'
    | 'direct_function_call'
    | 'mocks_internals'
    | 'technical_name'
    | 'internal_state'
    | 'performance'
    | 'security'
    | 'accessibility';

export interface ClassificationResult {
    type: TestType;
    confidence: number;
    signals: TestTypeSignals[];
}

export interface BehaviorScoreResult {
    score: number;
    behaviorCount: number;
    implementationCount: number;
    nonFunctionalCount: number;
    totalCount: number;
    byLayer?: Record<string, number>;
}

interface TestInput {
    name: string;
    layer: string;
    filepath: string;
    body?: string;
}

// ─── Behavior Signals (black-box) ───

const BEHAVIOR_NAME_PATTERNS = [
    /^user\s/i,
    /\buser\s(can|should|sees|gets|is\s(able|redirected|shown))\b/i,
    /\bshould\s(display|show|render|navigate|redirect|present|open)\b/i,
    /\b(displays?|shows?|renders?|presents?)\s(error|message|warning|notification|toast|modal|dialog|page|view|screen)\b/i,
    /\b(navigates?|redirects?)\s(to|back|away)\b/i,
    /\bsees?\s/i,
    /\bclicks?\s/i,
    /\bsubmits?\s/i,
    /\btypes?\s/i,
    /\blogs?\s(in|out)\b/i,
    /\bsigns?\s(in|up|out)\b/i,
];

const BEHAVIOR_BODY_PATTERNS: { pattern: RegExp; signal: TestTypeSignals }[] = [
    // UI selectors
    { pattern: /getByRole\s*\(/i, signal: 'ui_selectors' },
    { pattern: /getByText\s*\(/i, signal: 'ui_selectors' },
    { pattern: /getByTestId\s*\(/i, signal: 'ui_selectors' },
    { pattern: /getByLabel\s*\(/i, signal: 'ui_selectors' },
    { pattern: /getByPlaceholder\s*\(/i, signal: 'ui_selectors' },
    { pattern: /screen\./i, signal: 'ui_selectors' },
    { pattern: /querySelector\s*\(/i, signal: 'ui_selectors' },
    { pattern: /locator\s*\(/i, signal: 'ui_selectors' },
    { pattern: /cy\.(get|find)\s*\(/i, signal: 'ui_selectors' },
    { pattern: /data-testid/i, signal: 'ui_selectors' },
    { pattern: /\.toBeVisible\(\)/i, signal: 'ui_selectors' },
    { pattern: /\.toBeInTheDocument\(\)/i, signal: 'ui_selectors' },
    { pattern: /\.toBeDisabled\(\)/i, signal: 'ui_selectors' },

    // Page objects
    { pattern: /\w+Page\.\w+/i, signal: 'page_objects' },
    { pattern: /new\s+\w+Page\s*\(/i, signal: 'page_objects' },
    { pattern: /\w+Modal\.\w+/i, signal: 'page_objects' },

    // Component rendering
    { pattern: /render\s*\(\s*</i, signal: 'component_render' },
    { pattern: /render\s*\(\s*<\w+/i, signal: 'component_render' },
    { pattern: /renderHook\s*\(/i, signal: 'component_render' },

    // HTTP status assertions
    { pattern: /expect\(.*\.status\)\.toBe\(\d{3}\)/i, signal: 'http_status' },
    { pattern: /\.expect\(\d{3}\)/i, signal: 'http_status' },
    { pattern: /res\.status/i, signal: 'http_status' },
    { pattern: /response\.status/i, signal: 'http_status' },
    { pattern: /request\s*\(\s*app\s*\)/i, signal: 'http_status' },

    // User interactions
    { pattern: /fireEvent\.\w+/i, signal: 'user_interaction' },
    { pattern: /userEvent\.\w+/i, signal: 'user_interaction' },
    { pattern: /\.click\s*\(/i, signal: 'user_interaction' },
    { pattern: /\.fill\s*\(/i, signal: 'user_interaction' },
    { pattern: /\.type\s*\(/i, signal: 'user_interaction' },

    // Navigation
    { pattern: /page\.goto\s*\(/i, signal: 'navigation' },
    { pattern: /cy\.visit\s*\(/i, signal: 'navigation' },
    { pattern: /navigate\s*\(/i, signal: 'navigation' },
    { pattern: /toHaveURL/i, signal: 'navigation' },
];

// ─── Implementation Signals (white-box) ───

const IMPLEMENTATION_NAME_PATTERNS = [
    /^(validates?|parses?|calculates?|computes?|converts?|transforms?|formats?|normalizes?|sanitizes?|encodes?|decodes?|hashes?|encrypts?|decrypts?)\s/i,
    /^(trims?|splits?|joins?|merges?|filters?|maps?|reduces?|sorts?)\s/i,
    /\b(returns?|throws?|calls?|invokes?|emits?)\s(?!\d{3}\b)/i,
    /^handles?\s(?!network|timeout)/i,
    /^sets?\s/i,
    /\bcorrectly$/i,
];

const IMPLEMENTATION_BODY_PATTERNS: { pattern: RegExp; signal: TestTypeSignals }[] = [
    // Mocking
    { pattern: /jest\.mock\s*\(/i, signal: 'mocks_internals' },
    { pattern: /jest\.spyOn\s*\(/i, signal: 'mocks_internals' },
    { pattern: /vi\.mock\s*\(/i, signal: 'mocks_internals' },
    { pattern: /vi\.spyOn\s*\(/i, signal: 'mocks_internals' },
    { pattern: /sinon\.(stub|spy|mock)/i, signal: 'mocks_internals' },
    { pattern: /\.toHaveBeenCalled/i, signal: 'mocks_internals' },

    // Direct function testing (pure function assertion, no HTTP or render)
    { pattern: /expect\(\w+\([^)]*\)\)\.toBe/i, signal: 'direct_function_call' },
    { pattern: /expect\(\w+\([^)]*\)\)\.toEqual/i, signal: 'direct_function_call' },
    { pattern: /expect\(\w+\([^)]*\)\)\.toThrow/i, signal: 'direct_function_call' },
    { pattern: /(?:const|let|var)\s+\w+\s*=\s*\w+\([^)]*\);\s*expect\(/i, signal: 'direct_function_call' },

    // Internal state
    { pattern: /\.current\.\w+\)\.toBe/i, signal: 'internal_state' },
    { pattern: /expect\(.*\.state\b/i, signal: 'internal_state' },
];

// ─── Non-functional Signals ───

const NON_FUNCTIONAL_PATTERNS: { pattern: RegExp; signal: TestTypeSignals }[] = [
    // Performance
    { pattern: /\.toBeLessThan\(\d{3,}\)/i, signal: 'performance' },
    { pattern: /Date\.now\(\)/i, signal: 'performance' },
    { pattern: /performance\.(now|mark|measure)/i, signal: 'performance' },
    { pattern: /\b(latency|throughput|response.time)\b/i, signal: 'performance' },
    { pattern: /\.perf\.(ts|js)/i, signal: 'performance' },

    // Security
    { pattern: /password.*toBeUndefined/i, signal: 'security' },
    { pattern: /token.*toBeUndefined/i, signal: 'security' },
    { pattern: /security|xss|injection|csrf|cors/i, signal: 'security' },
    { pattern: /secret.*exposed|leak/i, signal: 'security' },

    // Accessibility
    { pattern: /toHaveAccessibleName/i, signal: 'accessibility' },
    { pattern: /axe|a11y|aria-/i, signal: 'accessibility' },
];

// ─── Classification Logic ───

export function classifyTestType(test: TestInput): ClassificationResult {
    const signals: TestTypeSignals[] = [];
    let behaviorScore = 0;
    let implementationScore = 0;
    let nonFunctionalScore = 0;

    const body = test.body || '';
    const name = test.name;
    const lower = (name + ' ' + body).toLowerCase();

    // ── Layer-based signal ──
    if (test.layer === 'e2e') {
        signals.push('e2e_layer');
        behaviorScore += 3;
    }

    // ── Non-functional checks (highest priority) ──
    const nfFilePath = test.filepath.toLowerCase();
    for (const { pattern, signal } of NON_FUNCTIONAL_PATTERNS) {
        if (pattern.test(body) || pattern.test(name) || pattern.test(nfFilePath)) {
            if (!signals.includes(signal)) {
                signals.push(signal);
                nonFunctionalScore += 2;
            }
        }
    }

    // ── Behavior name patterns ──
    for (const pattern of BEHAVIOR_NAME_PATTERNS) {
        if (pattern.test(name)) {
            if (!signals.includes('user_centric_name')) {
                signals.push('user_centric_name');
            }
            behaviorScore += 2;
            break;
        }
    }

    // ── Behavior body patterns ──
    for (const { pattern, signal } of BEHAVIOR_BODY_PATTERNS) {
        if (pattern.test(body)) {
            if (!signals.includes(signal)) {
                signals.push(signal);
                // HTTP status and component render are strong behavior signals
                behaviorScore += (signal === 'http_status' || signal === 'component_render') ? 2.5 : 1.5;
            }
        }
    }

    // ── Implementation name patterns ──
    for (const pattern of IMPLEMENTATION_NAME_PATTERNS) {
        if (pattern.test(name)) {
            if (!signals.includes('technical_name')) {
                signals.push('technical_name');
            }
            implementationScore += 2;
            break;
        }
    }

    // ── Implementation body patterns ──
    for (const { pattern, signal } of IMPLEMENTATION_BODY_PATTERNS) {
        if (pattern.test(body)) {
            if (!signals.includes(signal)) {
                signals.push(signal);
                implementationScore += 1.5;
            }
        }
    }

    // ── Determine type ──
    let type: TestType;
    let confidence: number;

    // Non-functional takes priority if signals are present (regardless of layer)
    if (nonFunctionalScore > 0 && signals.some(s => ['performance', 'security', 'accessibility'].includes(s))) {
        type = 'non_functional';
        confidence = Math.min(0.5 + nonFunctionalScore * 0.1, 1.0);
    } else if (behaviorScore > implementationScore) {
        type = 'behavior';
        confidence = Math.min(0.5 + behaviorScore * 0.08, 1.0);
    } else if (implementationScore > behaviorScore) {
        type = 'implementation';
        confidence = Math.min(0.5 + implementationScore * 0.08, 1.0);
    } else {
        // Tie-break: unit defaults to implementation, api/e2e default to behavior
        type = test.layer === 'unit' ? 'implementation' : 'behavior';
        confidence = 0.5;
    }

    return { type, confidence, signals };
}

// ─── Behavior Coverage Score ───

export function calculateBehaviorScore(
    classifications: Pick<ClassificationResult, 'type' | 'confidence' | 'signals'>[],
    layers?: string[],
): BehaviorScoreResult {
    if (classifications.length === 0) {
        return {
            score: 0,
            behaviorCount: 0,
            implementationCount: 0,
            nonFunctionalCount: 0,
            totalCount: 0,
        };
    }

    const behaviorCount = classifications.filter(c => c.type === 'behavior').length;
    const implementationCount = classifications.filter(c => c.type === 'implementation').length;
    const nonFunctionalCount = classifications.filter(c => c.type === 'non_functional').length;
    const totalCount = classifications.length;
    const score = totalCount > 0 ? Math.round((behaviorCount / totalCount) * 100) / 100 : 0;

    const result: BehaviorScoreResult = {
        score,
        behaviorCount,
        implementationCount,
        nonFunctionalCount,
        totalCount,
    };

    // Per-layer breakdown
    if (layers && layers.length === classifications.length) {
        const layerGroups: Record<string, { behavior: number; total: number }> = {};
        for (let i = 0; i < classifications.length; i++) {
            const layer = layers[i];
            if (!layerGroups[layer]) layerGroups[layer] = { behavior: 0, total: 0 };
            layerGroups[layer].total++;
            if (classifications[i].type === 'behavior') layerGroups[layer].behavior++;
        }
        result.byLayer = {};
        for (const [layer, data] of Object.entries(layerGroups)) {
            result.byLayer[layer] = data.total > 0 ? Math.round((data.behavior / data.total) * 100) / 100 : 0;
        }
    }

    return result;
}
