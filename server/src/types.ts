// ─── Enums ───

export type TestLayer = 'unit' | 'api' | 'e2e';
export type TestStatus = 'pass' | 'fail' | 'skipped' | 'pending';
export type ScenarioSource = 'inferred' | 'manual' | 'imported';
export type LinkType = 'verifies' | 'partially_verifies' | 'duplicates';
export type TestFramework = 'jest' | 'vitest' | 'playwright' | 'cypress' | 'supertest' | 'other';
export type InsightType = 'missing_layer' | 'redundancy' | 'expensive_e2e' | 'weak_assertion';
export type InsightSeverity = 'high' | 'medium' | 'low';
export type RecommendAction = 'keep_at_layer' | 'move_to_api' | 'move_to_unit' | 'remove_duplicate' | 'add_lower_level' | 'migrate_framework';
export type RecommendStatus = 'pending' | 'accepted' | 'rejected' | 'done';

// ─── Core Domain Types ───

export interface Feature {
    id: string;
    name: string;
    description?: string;
    category?: string;
    githubRepoUrl?: string;
    scenarios: BehaviorScenario[];
    createdAt: Date;
    updatedAt: Date;
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
    createdAt: Date;
    updatedAt: Date;
}

export type TestClassification = 'behavior' | 'implementation' | 'non_functional' | 'unknown';

export interface TestArtifact {
    id: string;
    name: string;
    layer: TestLayer;
    filepath?: string;
    codeSignature?: string;
    intentSummary?: string;
    framework?: TestFramework;
    testType?: TestClassification;
    createdAt: Date;
    updatedAt: Date;
}

export interface ScenarioLink {
    id: string;
    scenarioId: string;
    testArtifactId: string;
    confidence: number;
    rationale?: string;
    linkType: LinkType;
    createdAt: Date;
}

export interface ScenarioLinkWithTest extends ScenarioLink {
    testArtifact: TestArtifact;
}

export interface ExecutionRun {
    id: string;
    testArtifactId: string;
    status: TestStatus;
    durationMs?: number;
    commitHash?: string;
    ciJobId?: string;
    createdAt: Date;
}

export interface OptimizationInsight {
    id: string;
    scenarioId: string;
    type: InsightType;
    severity: InsightSeverity;
    summary: string;
    recommendation?: string;
    createdAt: Date;
}

// ─── API Response Types ───

export interface FeatureSummary {
    id: string;
    name: string;
    category?: string;
    scenarioCount: number;
    testCount: { unit: number; api: number; e2e: number };
    insightCount: number;
    coverageStatus: 'full' | 'partial' | 'minimal';
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
