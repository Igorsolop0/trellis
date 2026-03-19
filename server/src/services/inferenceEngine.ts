import { DataService } from './dataService';
import { AIService, cosineSimilarity } from './aiService';
import { EnrichedTestMeta, parseAndEnrichTests } from './astParserService';
import { IngestionService, TestFile } from './ingestionService';
import { GitHubIngestionService } from './githubIngestionService';
import { TestLayer, TestFramework, InsightType } from '../types';
import { classifyTestType, calculateBehaviorScore } from './classificationService';

export type InferenceSource =
    | { type: 'local'; repoPath: string }
    | { type: 'github'; repoFullName: string };

const dataService = new DataService();
const aiService = new AIService();

// ─── Types ───

interface TestCluster {
    behaviorKey: string;
    title: string;
    tests: EnrichedTestMeta[];
}

interface LinkCandidate {
    testArtifactId: string;
    confidence: number;
    rationale: string;
    linkType: 'verifies' | 'partially_verifies' | 'duplicates';
}

// ─── Heuristic Helpers ───

/** Extract a normalized behavior key from test name + describe blocks */
function behaviorKey(test: EnrichedTestMeta): string {
    const parts = [...test.describeBlocks, test.testName];
    return parts
        .join(' ')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Extract domain keywords from test name */
function domainKeywords(text: string): string[] {
    const stopwords = new Set([
        'should', 'when', 'then', 'given', 'the', 'a', 'an', 'is', 'are',
        'it', 'can', 'with', 'for', 'on', 'in', 'to', 'be', 'not', 'and',
        'or', 'of', 'that', 'this', 'test', 'tests', 'spec', 'describe',
    ]);
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopwords.has(w));
}

/** Jaccard similarity between two keyword sets */
function keywordSimilarity(a: string[], b: string[]): number {
    const setA = new Set(a);
    const setB = new Set(b);
    const intersection = [...setA].filter(x => setB.has(x)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
}

/** Detect framework from enriched meta */
function toFramework(fw: string | null): TestFramework | undefined {
    if (!fw) return undefined;
    const map: Record<string, TestFramework> = {
        jest: 'jest', vitest: 'vitest', playwright: 'playwright',
        cypress: 'cypress', supertest: 'supertest',
    };
    return map[fw] || 'other';
}

// ─── Step 1: Ingest & Enrich ───

async function ingestAndEnrich(source: InferenceSource): Promise<{ file: TestFile; enriched: EnrichedTestMeta[] }[]> {
    let files: TestFile[];

    if (source.type === 'github') {
        const ghIngestion = new GitHubIngestionService(source.repoFullName);
        files = await ghIngestion.scanRepository();
    } else {
        const ingestion = new IngestionService(source.repoPath);
        files = await ingestion.scanRepository();
    }

    return files.map(file => ({
        file,
        enriched: parseAndEnrichTests(file.content, file.path),
    }));
}

// ─── Step 2: Cluster Tests into Behavior Scenarios ───

function clusterByHeuristics(allTests: EnrichedTestMeta[]): TestCluster[] {
    const clusters = new Map<string, TestCluster>();

    for (const test of allTests) {
        const keywords = domainKeywords(test.testName);
        const describeContext = test.describeBlocks.join(' ').toLowerCase();

        // Try to find existing cluster with high keyword overlap
        let bestCluster: TestCluster | null = null;
        let bestScore = 0;

        for (const cluster of clusters.values()) {
            const clusterKeywords = domainKeywords(cluster.title);
            const score = keywordSimilarity(keywords, clusterKeywords);

            // Also check endpoint overlap
            if (test.endpoints.length > 0) {
                const clusterEndpoints = cluster.tests.flatMap(t => t.endpoints);
                const endpointOverlap = test.endpoints.some(e => clusterEndpoints.includes(e));
                if (endpointOverlap) {
                    // Boost score for shared endpoints
                    const boosted = score + 0.3;
                    if (boosted > bestScore) {
                        bestScore = boosted;
                        bestCluster = cluster;
                    }
                    continue;
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestCluster = cluster;
            }
        }

        // Threshold: merge if similarity is high enough
        if (bestCluster && bestScore >= 0.35) {
            bestCluster.tests.push(test);
        } else {
            // Create new cluster
            // Generate a human-readable title from describe + test name
            const title = test.describeBlocks.length > 0
                ? test.describeBlocks[test.describeBlocks.length - 1]
                : test.testName;

            const key = behaviorKey(test);
            clusters.set(key, {
                behaviorKey: key,
                title,
                tests: [test],
            });
        }
    }

    // Merge single-test clusters that share describe blocks
    const result: TestCluster[] = [];
    const describeGroups = new Map<string, TestCluster>();

    for (const cluster of clusters.values()) {
        if (cluster.tests.length === 1 && cluster.tests[0].describeBlocks.length > 0) {
            const descKey = cluster.tests[0].describeBlocks.join(' > ').toLowerCase();
            const existing = describeGroups.get(descKey);
            if (existing) {
                existing.tests.push(...cluster.tests);
            } else {
                describeGroups.set(descKey, cluster);
            }
        } else {
            result.push(cluster);
        }
    }

    for (const cluster of describeGroups.values()) {
        result.push(cluster);
    }

    return result;
}

// ─── Step 3: AI-powered Scenario Clustering ───

async function refineWithAI(allTests: EnrichedTestMeta[], featureName: string, heuristicClusters: TestCluster[]): Promise<TestCluster[]> {
    if (!aiService.isAIEnabled()) return heuristicClusters;

    console.log('[Inference] Using AI to cluster tests into behavior scenarios...');

    const testData = allTests.map(t => ({
        name: t.describeBlocks.length > 0
            ? `${t.describeBlocks.join(' > ')} > ${t.testName}`
            : t.testName,
        layer: aiService.detectLayer(t.testName, t.filePath),
        filepath: t.filePath,
        body: t.body?.substring(0, 200),
    }));

    const aiScenarios = await aiService.inferScenarios(featureName, testData);

    if (aiScenarios.length === 0) {
        console.log('[Inference] AI returned no scenarios, falling back to heuristics');
        return heuristicClusters;
    }

    console.log(`[Inference] AI grouped tests into ${aiScenarios.length} scenarios`);

    // Convert AI result back to TestCluster format
    const aiClusters: TestCluster[] = [];
    const usedIndices = new Set<number>();

    for (const scenario of aiScenarios) {
        const clusterTests: EnrichedTestMeta[] = [];
        for (const idx of scenario.testIndices) {
            if (idx >= 0 && idx < allTests.length && !usedIndices.has(idx)) {
                clusterTests.push(allTests[idx]);
                usedIndices.add(idx);
            }
        }
        if (clusterTests.length > 0) {
            aiClusters.push({
                behaviorKey: scenario.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim(),
                title: scenario.title,
                tests: clusterTests,
            });
        }
    }

    // Add any tests not covered by AI into their own clusters
    for (let i = 0; i < allTests.length; i++) {
        if (!usedIndices.has(i)) {
            const test = allTests[i];
            aiClusters.push({
                behaviorKey: behaviorKey(test),
                title: test.testName,
                tests: [test],
            });
        }
    }

    return aiClusters;
}

// ─── Step 4: Compute Confidence & Link Type ───

function computeLinkConfidence(test: EnrichedTestMeta, cluster: TestCluster): LinkCandidate {
    let confidence = 0.5; // base
    let rationale: string[] = [];

    const testKeywords = domainKeywords(test.testName);
    const clusterKeywords = domainKeywords(cluster.title);
    const kwSim = keywordSimilarity(testKeywords, clusterKeywords);

    if (kwSim > 0.5) {
        confidence += 0.2;
        rationale.push(`keyword overlap: ${(kwSim * 100).toFixed(0)}%`);
    }

    // Shared describe block
    const testDescribe = test.describeBlocks.join(' > ').toLowerCase();
    const clusterTests = cluster.tests.filter(t => t !== test);
    const sharedDescribe = clusterTests.some(t =>
        t.describeBlocks.join(' > ').toLowerCase() === testDescribe
    );
    if (sharedDescribe) {
        confidence += 0.15;
        rationale.push('shared describe block');
    }

    // Shared endpoints
    const clusterEndpoints = clusterTests.flatMap(t => t.endpoints);
    const sharedEndpoints = test.endpoints.filter(e => clusterEndpoints.includes(e));
    if (sharedEndpoints.length > 0) {
        confidence += 0.15;
        rationale.push(`shared endpoints: ${sharedEndpoints.join(', ')}`);
    }

    // Shared selectors (cross-layer signal)
    const clusterSelectors = clusterTests.flatMap(t => t.selectors);
    const sharedSelectors = test.selectors.filter(s => clusterSelectors.includes(s));
    if (sharedSelectors.length > 0) {
        confidence += 0.1;
        rationale.push(`shared selectors: ${sharedSelectors.join(', ')}`);
    }

    confidence = Math.min(confidence, 1.0);

    // Determine link type
    let linkType: 'verifies' | 'partially_verifies' | 'duplicates' = 'verifies';
    if (confidence < 0.6) linkType = 'partially_verifies';

    // Check for duplication: same layer, high keyword overlap
    const sameLaTests = clusterTests.filter(t => {
        const tLayer = aiService.detectLayer(t.testName, t.filePath);
        const thisLayer = aiService.detectLayer(test.testName, test.filePath);
        return tLayer === thisLayer;
    });
    if (sameLaTests.length > 0 && kwSim > 0.7) {
        linkType = 'duplicates';
        rationale.push('potential duplicate within same layer');
    }

    return {
        testArtifactId: '', // filled later
        confidence,
        rationale: rationale.join('; '),
        linkType,
    };
}

// ─── Step 5: Gap & Redundancy Analysis ───

interface InsightData {
    type: InsightType;
    severity: 'high' | 'medium' | 'low';
    summary: string;
    recommendation: string;
}

function analyzeScenarioInsights(cluster: TestCluster): InsightData[] {
    const insights: InsightData[] = [];

    const layers = new Set(cluster.tests.map(t => aiService.detectLayer(t.testName, t.filePath)));

    // Missing layer detection
    if (!layers.has('unit') && layers.size > 0) {
        insights.push({
            type: 'missing_layer',
            severity: 'medium',
            summary: `Scenario "${cluster.title}" has no unit tests`,
            recommendation: 'Add unit tests for faster feedback and cheaper coverage of core logic',
        });
    }
    if (!layers.has('api') && layers.has('e2e')) {
        insights.push({
            type: 'missing_layer',
            severity: 'high',
            summary: `Scenario "${cluster.title}" has E2E but no API tests`,
            recommendation: 'API tests are faster and more stable than E2E — move validation logic to API layer',
        });
    }
    if (!layers.has('e2e') && layers.size > 0) {
        insights.push({
            type: 'missing_layer',
            severity: 'low',
            summary: `Scenario "${cluster.title}" has no E2E tests`,
            recommendation: 'Consider adding E2E test for critical user-facing behavior if this is a key flow',
        });
    }

    // E2E-only scenario
    if (layers.has('e2e') && layers.size === 1) {
        insights.push({
            type: 'expensive_e2e',
            severity: 'high',
            summary: `Scenario "${cluster.title}" relies only on E2E tests`,
            recommendation: 'No lower-level safety net — if E2E breaks, there is no fallback. Add unit/API tests',
        });
    }

    // Redundancy within same assertions across layers
    const allAssertions = cluster.tests.map(t => ({
        layer: aiService.detectLayer(t.testName, t.filePath),
        assertions: t.assertions,
        name: t.testName,
    }));

    // Check if same assertion is verified at multiple expensive layers
    for (const e2eTest of allAssertions.filter(a => a.layer === 'e2e')) {
        for (const unitTest of allAssertions.filter(a => a.layer === 'unit')) {
            const shared = e2eTest.assertions.filter(a => unitTest.assertions.includes(a));
            if (shared.length > 0) {
                insights.push({
                    type: 'redundancy',
                    severity: 'medium',
                    summary: `"${e2eTest.name}" (E2E) and "${unitTest.name}" (unit) share assertions: ${shared.join(', ')}`,
                    recommendation: 'Consider removing the E2E assertion if unit test already covers this logic',
                });
            }
        }
    }

    return insights;
}

// ─── Main Pipeline ───

export interface InferenceResult {
    featureId: string;
    scenariosCreated: number;
    artifactsUpserted: number;
    linksCreated: number;
    insightsCreated: number;
}

export async function runInferencePipeline(
    featureId: string,
    source: InferenceSource,
): Promise<InferenceResult> {
    const result: InferenceResult = {
        featureId,
        scenariosCreated: 0,
        artifactsUpserted: 0,
        linksCreated: 0,
        insightsCreated: 0,
    };

    // Verify feature exists
    const feature = await dataService.getFeatureById(featureId);
    if (!feature) throw new Error(`Feature ${featureId} not found`);

    // Step 1: Ingest and enrich
    const sourceLabel = source.type === 'github' ? source.repoFullName : source.repoPath;
    console.log(`[Inference] Scanning ${source.type}: ${sourceLabel}...`);
    const fileResults = await ingestAndEnrich(source);
    const allTests = fileResults.flatMap(fr => fr.enriched);
    console.log(`[Inference] Found ${allTests.length} tests in ${fileResults.length} files`);

    if (allTests.length === 0) return result;

    // Step 2: Cluster by heuristics
    let clusters = clusterByHeuristics(allTests);
    console.log(`[Inference] Created ${clusters.length} heuristic clusters`);

    // Step 3: Refine with AI (replaces embedding-based refinement)
    clusters = await refineWithAI(allTests, feature.name, clusters);
    console.log(`[Inference] ${clusters.length} clusters after AI refinement`);

    // Step 4: Persist everything
    for (const cluster of clusters) {
        // Create BehaviorScenario
        const avgConfidence = cluster.tests.reduce((sum, t) => {
            const link = computeLinkConfidence(t, cluster);
            return sum + link.confidence;
        }, 0) / cluster.tests.length;

        const scenario = await dataService.createScenario({
            featureId,
            title: cluster.title,
            summary: `${cluster.tests.length} tests across ${new Set(cluster.tests.map(t => aiService.detectLayer(t.testName, t.filePath))).size} layers`,
            confidence: Math.round(avgConfidence * 100) / 100,
            source: 'inferred',
        });
        result.scenariosCreated++;

        // Upsert TestArtifacts and create links
        for (const test of cluster.tests) {
            const layer = aiService.detectLayer(test.testName, test.filePath) as TestLayer;
            const fullName = test.describeBlocks.length > 0
                ? `${test.describeBlocks.join(' > ')} > ${test.testName}`
                : test.testName;

            // AI-powered intent summarization
            let intentSummary: string | undefined;
            if (test.body && aiService.isAIEnabled()) {
                intentSummary = await aiService.summarizeTestIntent(test.body);
            } else if (test.assertions.length > 0) {
                intentSummary = `Asserts: ${test.assertions.slice(0, 3).join(', ')}`;
            }

            // Classify test type (behavior vs implementation)
            const classification = classifyTestType({
                name: fullName,
                layer,
                filepath: test.filePath,
                body: test.body,
            });

            const artifact = await dataService.upsertTestArtifact({
                name: fullName,
                layer,
                filepath: test.filePath,
                codeSignature: test.body?.substring(0, 200),
                intentSummary,
                framework: toFramework(test.framework) as string | undefined,
                testType: classification.type,
            });
            result.artifactsUpserted++;

            // Link with confidence
            const linkData = computeLinkConfidence(test, cluster);
            await dataService.linkTestToScenario({
                scenarioId: scenario.id,
                testArtifactId: artifact.id,
                confidence: linkData.confidence,
                rationale: linkData.rationale,
                linkType: linkData.linkType,
            });
            result.linksCreated++;
        }

        // Step 5: Generate insights (heuristic + AI)
        const heuristicInsights = analyzeScenarioInsights(cluster);

        // AI-powered gap analysis
        const layerCounts = {
            unit: cluster.tests.filter(t => aiService.detectLayer(t.testName, t.filePath) === 'unit').length,
            api: cluster.tests.filter(t => aiService.detectLayer(t.testName, t.filePath) === 'api').length,
            e2e: cluster.tests.filter(t => aiService.detectLayer(t.testName, t.filePath) === 'e2e').length,
        };
        const aiInsights = await aiService.analyzeGaps(cluster.title, layerCounts);

        // Merge: heuristic first, then AI (deduplicated)
        const allInsights = [...heuristicInsights];
        for (const ai of aiInsights) {
            const isDuplicate = allInsights.some(h =>
                h.type === ai.type && h.summary.toLowerCase().includes(cluster.title.toLowerCase().substring(0, 20))
            );
            if (!isDuplicate) {
                allInsights.push({
                    type: ai.type as InsightType,
                    severity: ai.severity as 'high' | 'medium' | 'low',
                    summary: ai.summary,
                    recommendation: ai.recommendation,
                });
            }
        }

        for (const insight of allInsights) {
            await dataService.createInsight({
                scenarioId: scenario.id,
                type: insight.type,
                severity: insight.severity,
                summary: insight.summary,
                recommendation: insight.recommendation,
            });
            result.insightsCreated++;
        }
    }

    return result;
}

// ─── Standalone Analysis (for existing artifacts in DB) ───

export async function analyzeExistingFeature(featureId: string): Promise<InferenceResult> {
    const result: InferenceResult = {
        featureId,
        scenariosCreated: 0,
        artifactsUpserted: 0,
        linksCreated: 0,
        insightsCreated: 0,
    };

    const feature = await dataService.getFeatureById(featureId);
    if (!feature) throw new Error(`Feature ${featureId} not found`);

    // Get all unlinked test artifacts
    const allArtifacts = await dataService.getAllTestArtifacts();

    if (allArtifacts.length === 0) return result;

    // Convert artifacts to enriched format for clustering
    const pseudoTests: EnrichedTestMeta[] = allArtifacts.map(a => ({
        describeBlocks: a.name.includes(' > ') ? a.name.split(' > ').slice(0, -1) : [],
        testName: a.name.includes(' > ') ? a.name.split(' > ').pop()! : a.name,
        body: a.codeSignature || '',
        filePath: a.filepath || '',
        assertions: [],
        endpoints: [],
        selectors: [],
        actionVerbs: [],
        pageObjects: [],
        framework: a.framework || null,
    }));

    let clusters = clusterByHeuristics(pseudoTests);
    clusters = await refineWithAI(pseudoTests, feature.name, clusters);

    for (const cluster of clusters) {
        const avgConfidence = cluster.tests.reduce((sum, t) => {
            const link = computeLinkConfidence(t, cluster);
            return sum + link.confidence;
        }, 0) / cluster.tests.length;

        const scenario = await dataService.createScenario({
            featureId,
            title: cluster.title,
            summary: `${cluster.tests.length} tests across ${new Set(cluster.tests.map(t => aiService.detectLayer(t.testName, t.filePath))).size} layers`,
            confidence: Math.round(avgConfidence * 100) / 100,
            source: 'inferred',
        });
        result.scenariosCreated++;

        for (const test of cluster.tests) {
            const fullName = test.describeBlocks.length > 0
                ? `${test.describeBlocks.join(' > ')} > ${test.testName}`
                : test.testName;

            const artifact = allArtifacts.find(a => a.name === fullName);
            if (!artifact) continue;

            const linkData = computeLinkConfidence(test, cluster);
            await dataService.linkTestToScenario({
                scenarioId: scenario.id,
                testArtifactId: artifact.id,
                confidence: linkData.confidence,
                rationale: linkData.rationale,
                linkType: linkData.linkType,
            });
            result.linksCreated++;
        }

        const insights = analyzeScenarioInsights(cluster);
        for (const insight of insights) {
            await dataService.createInsight({
                scenarioId: scenario.id,
                type: insight.type,
                severity: insight.severity,
                summary: insight.summary,
                recommendation: insight.recommendation,
            });
            result.insightsCreated++;
        }
    }

    return result;
}
