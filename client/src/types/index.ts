// ─── Enums ───

export type TestLayer = 'unit' | 'api' | 'e2e';
export type TestStatus = 'pass' | 'fail' | 'skipped' | 'pending';
export type ScenarioSource = 'inferred' | 'manual' | 'imported';
export type LinkType = 'verifies' | 'partially_verifies' | 'duplicates';
export type InsightType = 'missing_layer' | 'redundancy' | 'expensive_e2e' | 'weak_assertion';
export type InsightSeverity = 'high' | 'medium' | 'low';
export type CoverageStatus = 'full' | 'partial' | 'minimal';

// ─── Core Domain ───

export interface Feature {
    id: string;
    name: string;
    description?: string;
    category?: string;
    githubRepoUrl?: string;
    scenarios: BehaviorScenario[];
    createdAt: string;
    updatedAt: string;
}

export interface BehaviorScenario {
    id: string;
    featureId: string;
    title: string;
    summary?: string;
    confidence: number;
    source: ScenarioSource;
    links: ScenarioLinkWithTest[];
    insights: OptimizationInsight[];
    createdAt: string;
    updatedAt: string;
}

export type TestClassification = 'behavior' | 'implementation' | 'non_functional' | 'unknown';

export interface TestArtifact {
    id: string;
    name: string;
    layer: TestLayer;
    filepath?: string;
    codeSignature?: string;
    intentSummary?: string;
    framework?: string;
    testType?: TestClassification;
    createdAt: string;
    updatedAt: string;
}

export interface ScenarioLink {
    id: string;
    scenarioId: string;
    testArtifactId: string;
    confidence: number;
    rationale?: string;
    linkType: LinkType;
    createdAt: string;
}

export interface ScenarioLinkWithTest extends ScenarioLink {
    testArtifact: TestArtifact;
}

export interface OptimizationInsight {
    id: string;
    scenarioId: string;
    type: InsightType;
    severity: InsightSeverity;
    summary: string;
    recommendation?: string;
    createdAt: string;
}

// ─── API Responses ───

export interface FeatureSummary {
    id: string;
    name: string;
    category?: string;
    scenarioCount: number;
    testCount: { unit: number; api: number; e2e: number };
    insightCount: number;
    coverageStatus: CoverageStatus;
    behaviorScore: number;
}

export interface ScenarioCoverageChain {
    scenarioId: string;
    scenarioTitle: string;
    confidence: number;
    unit: TestArtifact[];
    api: TestArtifact[];
    e2e: TestArtifact[];
    insights: OptimizationInsight[];
}

export interface InferenceResult {
    message: string;
    featureId: string;
    scenariosCreated: number;
    artifactsUpserted: number;
    linksCreated: number;
    insightsCreated: number;
}

// ─── Phase 4: Optimization ───

export type RecommendAction = 'keep_at_layer' | 'move_to_api' | 'move_to_unit' | 'remove_duplicate' | 'add_lower_level' | 'migrate_framework';
export type RecommendStatus = 'pending' | 'accepted' | 'rejected' | 'done';

export interface Recommendation {
    id: string;
    scenarioId: string;
    testArtifactId?: string;
    testArtifact?: TestArtifact;
    action: RecommendAction;
    fromLayer?: TestLayer;
    toLayer?: TestLayer;
    reason: string;
    estimatedSavingMs: number;
    status: RecommendStatus;
    createdAt: string;
}

export interface CostBreakdown {
    featureId: string;
    featureName: string;
    totalCostMs: number;
    totalTests: number;
    byLayer: {
        layer: TestLayer;
        testCount: number;
        costMs: number;
        percentage: number;
        avgDuration: number;
    }[];
    byScenario: {
        scenarioId: string;
        title: string;
        costMs: number;
        testCount: number;
        layers: TestLayer[];
    }[];
    potentialSavingMs: number;
    potentialSavingPercent: number;
}
