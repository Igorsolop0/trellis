import { PrismaClient } from '@prisma/client';
import {
    Feature,
    BehaviorScenario,
    TestArtifact,
    ScenarioLinkWithTest,
    OptimizationInsight,
    FeatureSummary,
    ScenarioCoverageChain,
    TestLayer,
} from '../types';

const prisma = new PrismaClient();

// Full include tree for Feature → Scenarios → Links → TestArtifacts + Insights
const featureFullInclude = {
    scenarios: {
        include: {
            links: {
                include: {
                    testArtifact: true,
                },
            },
            insights: true,
        },
    },
} as const;

export class DataService {
    // ─── Features ───

    async getAllFeatures(): Promise<Feature[]> {
        const rows = await prisma.feature.findMany({
            include: featureFullInclude,
            orderBy: { createdAt: 'desc' },
        });
        return rows as unknown as Feature[];
    }

    async getFeatureById(id: string): Promise<Feature | null> {
        const row = await prisma.feature.findUnique({
            where: { id },
            include: featureFullInclude,
        });
        return row as unknown as Feature | null;
    }

    async createFeature(data: { name: string; description?: string; category?: string }): Promise<Feature> {
        const row = await prisma.feature.create({
            data,
            include: featureFullInclude,
        });
        return row as unknown as Feature;
    }

    async updateFeature(id: string, data: { githubRepoUrl?: string }): Promise<Feature> {
        const row = await prisma.feature.update({
            where: { id },
            data,
            include: featureFullInclude,
        });
        return row as unknown as Feature;
    }

    async deleteFeature(id: string): Promise<boolean> {
        try {
            await prisma.feature.delete({ where: { id } });
            return true;
        } catch {
            return false;
        }
    }

    // ─── Behavior Scenarios ───

    async createScenario(data: {
        featureId: string;
        title: string;
        summary?: string;
        confidence?: number;
        source?: 'inferred' | 'manual' | 'imported';
    }): Promise<BehaviorScenario> {
        const row = await prisma.behaviorScenario.create({
            data: {
                featureId: data.featureId,
                title: data.title,
                summary: data.summary,
                confidence: data.confidence ?? 0,
                source: data.source ?? 'inferred',
            },
            include: { links: { include: { testArtifact: true } }, insights: true },
        });
        return row as unknown as BehaviorScenario;
    }

    async getScenariosByFeature(featureId: string): Promise<BehaviorScenario[]> {
        const rows = await prisma.behaviorScenario.findMany({
            where: { featureId },
            include: { links: { include: { testArtifact: true } }, insights: true },
        });
        return rows as unknown as BehaviorScenario[];
    }

    // ─── Test Artifacts ───

    async upsertTestArtifact(data: {
        name: string;
        layer: TestLayer;
        filepath?: string;
        codeSignature?: string;
        intentSummary?: string;
        framework?: string;
    }): Promise<TestArtifact> {
        const row = await prisma.testArtifact.upsert({
            where: {
                filepath_name: {
                    filepath: data.filepath ?? '',
                    name: data.name,
                },
            },
            update: {
                layer: data.layer,
                codeSignature: data.codeSignature,
                intentSummary: data.intentSummary,
                framework: data.framework as any,
            },
            create: {
                name: data.name,
                layer: data.layer,
                filepath: data.filepath,
                codeSignature: data.codeSignature,
                intentSummary: data.intentSummary,
                framework: data.framework as any,
            },
        });
        return row as unknown as TestArtifact;
    }

    async getAllTestArtifacts(): Promise<TestArtifact[]> {
        const rows = await prisma.testArtifact.findMany({ orderBy: { createdAt: 'desc' } });
        return rows as unknown as TestArtifact[];
    }

    // ─── Scenario Links ───

    async linkTestToScenario(data: {
        scenarioId: string;
        testArtifactId: string;
        confidence?: number;
        rationale?: string;
        linkType?: 'verifies' | 'partially_verifies' | 'duplicates';
    }): Promise<void> {
        await prisma.scenarioLink.upsert({
            where: {
                scenarioId_testArtifactId: {
                    scenarioId: data.scenarioId,
                    testArtifactId: data.testArtifactId,
                },
            },
            update: {
                confidence: data.confidence ?? 0,
                rationale: data.rationale,
                linkType: data.linkType ?? 'verifies',
            },
            create: {
                scenarioId: data.scenarioId,
                testArtifactId: data.testArtifactId,
                confidence: data.confidence ?? 0,
                rationale: data.rationale,
                linkType: data.linkType ?? 'verifies',
            },
        });
    }

    // ─── Optimization Insights ───

    async createInsight(data: {
        scenarioId: string;
        type: string;
        severity?: string;
        summary: string;
        recommendation?: string;
    }): Promise<OptimizationInsight> {
        const row = await prisma.optimizationInsight.create({
            data: {
                scenarioId: data.scenarioId,
                type: data.type as any,
                severity: (data.severity as any) ?? 'medium',
                summary: data.summary,
                recommendation: data.recommendation,
            },
        });
        return row as unknown as OptimizationInsight;
    }

    async getInsightsByScenario(scenarioId: string): Promise<OptimizationInsight[]> {
        const rows = await prisma.optimizationInsight.findMany({
            where: { scenarioId },
        });
        return rows as unknown as OptimizationInsight[];
    }

    // ─── Execution Runs ───

    async recordRun(data: {
        testArtifactId: string;
        status: string;
        durationMs?: number;
        commitHash?: string;
        ciJobId?: string;
    }): Promise<void> {
        await prisma.executionRun.create({
            data: {
                testArtifactId: data.testArtifactId,
                status: data.status as any,
                durationMs: data.durationMs,
                commitHash: data.commitHash,
                ciJobId: data.ciJobId,
            },
        });
    }

    // ─── Computed Views ───

    async getFeatureSummaries(): Promise<FeatureSummary[]> {
        const features = await this.getAllFeatures();

        return features.map((f) => {
            const allTests = f.scenarios.flatMap((s) => s.links.map((l) => l.testArtifact));
            const unit = allTests.filter((t) => t.layer === 'unit').length;
            const api = allTests.filter((t) => t.layer === 'api').length;
            const e2e = allTests.filter((t) => t.layer === 'e2e').length;
            const insightCount = f.scenarios.reduce((sum, s) => sum + s.insights.length, 0);

            const layers = new Set(allTests.map((t) => t.layer));
            let coverageStatus: FeatureSummary['coverageStatus'] = 'minimal';
            if (layers.size === 3) coverageStatus = 'full';
            else if (layers.size === 2) coverageStatus = 'partial';

            return {
                id: f.id,
                name: f.name,
                category: f.category,
                scenarioCount: f.scenarios.length,
                testCount: { unit, api, e2e },
                insightCount,
                coverageStatus,
            };
        });
    }

    async getCoverageChains(featureId: string): Promise<ScenarioCoverageChain[]> {
        const scenarios = await this.getScenariosByFeature(featureId);

        return scenarios.map((s) => {
            const tests = s.links.map((l) => l.testArtifact);
            return {
                scenarioId: s.id,
                scenarioTitle: s.title,
                confidence: s.confidence,
                unit: tests.filter((t) => t.layer === 'unit'),
                api: tests.filter((t) => t.layer === 'api'),
                e2e: tests.filter((t) => t.layer === 'e2e'),
                insights: s.insights,
            };
        });
    }
}
