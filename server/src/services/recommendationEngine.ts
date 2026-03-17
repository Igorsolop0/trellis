import { PrismaClient } from '@prisma/client';
import { DataService } from './dataService';
import { TestLayer } from '../types';

const prisma = new PrismaClient();
const dataService = new DataService();

// ─── Cost Constants (industry averages) ───

const LAYER_COST_MS: Record<TestLayer, number> = {
    unit: 50,       // ~50ms avg
    api: 500,       // ~500ms avg
    e2e: 15000,     // ~15s avg
};

const LAYER_FLAKY_BASELINE: Record<TestLayer, number> = {
    unit: 0.01,     // 1% flaky rate
    api: 0.05,      // 5% flaky rate
    e2e: 0.15,      // 15% flaky rate
};

// ─── Types ───

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

export interface RecommendationData {
    scenarioId: string;
    testArtifactId?: string;
    action: string;
    fromLayer?: TestLayer;
    toLayer?: TestLayer;
    reason: string;
    estimatedSavingMs: number;
}

// ─── Cost Calculation ───

export async function calculateFeatureCost(featureId: string): Promise<CostBreakdown> {
    const feature = await dataService.getFeatureById(featureId);
    if (!feature) throw new Error(`Feature ${featureId} not found`);

    const byLayer: CostBreakdown['byLayer'] = [];
    const byScenario: CostBreakdown['byScenario'] = [];
    let totalCostMs = 0;
    let totalTests = 0;

    // Aggregate by layer
    const layerCounts: Record<TestLayer, { count: number; totalDuration: number }> = {
        unit: { count: 0, totalDuration: 0 },
        api: { count: 0, totalDuration: 0 },
        e2e: { count: 0, totalDuration: 0 },
    };

    for (const scenario of feature.scenarios) {
        let scenarioCost = 0;
        const scenarioLayers = new Set<TestLayer>();

        for (const link of scenario.links) {
            const t = link.testArtifact;
            const layer = t.layer as TestLayer;
            const duration = (t as any).avgDurationMs || LAYER_COST_MS[layer];

            layerCounts[layer].count++;
            layerCounts[layer].totalDuration += duration;
            scenarioCost += duration;
            scenarioLayers.add(layer);
            totalTests++;
        }

        totalCostMs += scenarioCost;
        byScenario.push({
            scenarioId: scenario.id,
            title: scenario.title,
            costMs: scenarioCost,
            testCount: scenario.links.length,
            layers: [...scenarioLayers],
        });
    }

    for (const layer of ['unit', 'api', 'e2e'] as TestLayer[]) {
        const { count, totalDuration } = layerCounts[layer];
        if (count > 0) {
            const costMs = totalDuration;
            byLayer.push({
                layer,
                testCount: count,
                costMs,
                percentage: totalCostMs > 0 ? Math.round((costMs / totalCostMs) * 100) : 0,
                avgDuration: Math.round(totalDuration / count),
            });
        }
    }

    // Calculate potential savings from recommendations
    const recommendations = await prisma.recommendation.findMany({
        where: {
            scenarioId: { in: feature.scenarios.map(s => s.id) },
            status: 'pending',
        },
    });
    const potentialSavingMs = recommendations.reduce((s, r) => s + r.estimatedSavingMs, 0);

    return {
        featureId,
        featureName: feature.name,
        totalCostMs,
        totalTests,
        byLayer,
        byScenario,
        potentialSavingMs,
        potentialSavingPercent: totalCostMs > 0 ? Math.round((potentialSavingMs / totalCostMs) * 100) : 0,
    };
}

// ─── Recommendation Generation ───

export async function generateRecommendations(featureId: string): Promise<RecommendationData[]> {
    const feature = await dataService.getFeatureById(featureId);
    if (!feature) throw new Error(`Feature ${featureId} not found`);

    const recommendations: RecommendationData[] = [];

    for (const scenario of feature.scenarios) {
        const unitTests = scenario.links.filter(l => l.testArtifact.layer === 'unit');
        const apiTests = scenario.links.filter(l => l.testArtifact.layer === 'api');
        const e2eTests = scenario.links.filter(l => l.testArtifact.layer === 'e2e');

        // 1. E2E tests that could move to API
        for (const e2eLink of e2eTests) {
            // If there's already API coverage for this scenario, E2E might be redundant
            if (apiTests.length > 0) {
                const saving = LAYER_COST_MS.e2e - LAYER_COST_MS.api;
                recommendations.push({
                    scenarioId: scenario.id,
                    testArtifactId: e2eLink.testArtifact.id,
                    action: 'move_to_api',
                    fromLayer: 'e2e',
                    toLayer: 'api',
                    reason: `"${e2eLink.testArtifact.name}" validates logic already covered by ${apiTests.length} API test(s). Moving to API saves ~${(saving / 1000).toFixed(1)}s per run`,
                    estimatedSavingMs: saving,
                });
            }

            // E2E with no lower-level safety net
            if (unitTests.length === 0 && apiTests.length === 0) {
                recommendations.push({
                    scenarioId: scenario.id,
                    testArtifactId: e2eLink.testArtifact.id,
                    action: 'add_lower_level',
                    fromLayer: 'e2e',
                    toLayer: 'unit',
                    reason: `"${e2eLink.testArtifact.name}" is E2E-only. Adding unit/API coverage creates a faster safety net and reduces reliance on slow E2E`,
                    estimatedSavingMs: 0,
                });
            }
        }

        // 2. Duplicate tests within same layer
        const duplicateLinks = scenario.links.filter(l => l.linkType === 'duplicates');
        for (const dupLink of duplicateLinks) {
            const duration = (dupLink.testArtifact as any).avgDurationMs || LAYER_COST_MS[dupLink.testArtifact.layer as TestLayer];
            recommendations.push({
                scenarioId: scenario.id,
                testArtifactId: dupLink.testArtifact.id,
                action: 'remove_duplicate',
                reason: `"${dupLink.testArtifact.name}" is flagged as duplicate. Removing saves ~${(duration / 1000).toFixed(1)}s per run`,
                estimatedSavingMs: duration,
            });
        }

        // 3. API tests that validate simple logic — could be unit
        for (const apiLink of apiTests) {
            if (unitTests.length === 0) {
                const saving = LAYER_COST_MS.api - LAYER_COST_MS.unit;
                recommendations.push({
                    scenarioId: scenario.id,
                    testArtifactId: apiLink.testArtifact.id,
                    action: 'move_to_unit',
                    fromLayer: 'api',
                    toLayer: 'unit',
                    reason: `Scenario has no unit tests. Consider moving validation logic from "${apiLink.testArtifact.name}" to unit level for ~${(saving / 1000).toFixed(1)}s savings`,
                    estimatedSavingMs: saving,
                });
            }
        }

        // 4. Cypress → Playwright migration
        const cypressTests = scenario.links.filter(l => l.testArtifact.framework === 'cypress');
        if (cypressTests.length > 0) {
            for (const cyLink of cypressTests) {
                recommendations.push({
                    scenarioId: scenario.id,
                    testArtifactId: cyLink.testArtifact.id,
                    action: 'migrate_framework',
                    reason: `"${cyLink.testArtifact.name}" uses Cypress. Consider migrating to Playwright for better parallel execution and CI performance`,
                    estimatedSavingMs: 0,
                });
            }
        }
    }

    // Persist recommendations
    for (const rec of recommendations) {
        await prisma.recommendation.create({
            data: {
                scenarioId: rec.scenarioId,
                testArtifactId: rec.testArtifactId,
                action: rec.action as any,
                fromLayer: rec.fromLayer as any,
                toLayer: rec.toLayer as any,
                reason: rec.reason,
                estimatedSavingMs: rec.estimatedSavingMs,
            },
        });
    }

    return recommendations;
}

// ─── Get existing recommendations ───

export async function getRecommendations(featureId: string) {
    const feature = await dataService.getFeatureById(featureId);
    if (!feature) throw new Error(`Feature ${featureId} not found`);

    const scenarioIds = feature.scenarios.map(s => s.id);

    return prisma.recommendation.findMany({
        where: { scenarioId: { in: scenarioIds } },
        include: { testArtifact: true },
        orderBy: { estimatedSavingMs: 'desc' },
    });
}

// ─── Update recommendation status ───

export async function updateRecommendationStatus(id: string, status: 'accepted' | 'rejected' | 'done') {
    return prisma.recommendation.update({
        where: { id },
        data: { status },
    });
}
