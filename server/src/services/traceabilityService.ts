import { Feature } from '../types';

export class TraceabilityService {
    async generateReport(features: Feature[]) {
        const report = {
            generatedAt: new Date().toISOString(),
            title: "Requirements Traceability Matrix (RTM)",
            version: "2.0",
            summary: {
                totalFeatures: features.length,
                totalScenarios: 0,
                totalTests: 0,
                fullCoverage: 0,
                partialCoverage: 0,
                minimal: 0,
            },
            traceability: [] as any[]
        };

        for (const feature of features) {
            const allTests = feature.scenarios.flatMap(s => s.links.map(l => l.testArtifact));
            const layers = new Set(allTests.map(t => t.layer));

            if (layers.size === 3) report.summary.fullCoverage++;
            else if (layers.size >= 1) report.summary.partialCoverage++;
            else report.summary.minimal++;

            report.summary.totalScenarios += feature.scenarios.length;
            report.summary.totalTests += allTests.length;

            report.traceability.push({
                featureId: feature.id,
                featureName: feature.name,
                scenarios: feature.scenarios.map(s => ({
                    scenarioId: s.id,
                    title: s.title,
                    confidence: s.confidence,
                    tests: s.links.map(l => ({
                        testId: l.testArtifact.id,
                        name: l.testArtifact.name,
                        layer: l.testArtifact.layer,
                        linkConfidence: l.confidence,
                        linkType: l.linkType,
                    })),
                    insights: s.insights.map(i => ({
                        type: i.type,
                        severity: i.severity,
                        summary: i.summary,
                    })),
                })),
            });
        }

        return report;
    }
}
