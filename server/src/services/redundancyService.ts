import { AIService } from './aiService';
import { ParsedTest } from './astParserService';

const aiService = new AIService();

export interface RedundancyWarning {
    warning: string;
    e2eTest: string;
    unitTest: string;
    reason: string;
    suggestion: string;
    overlapScore: number;
}

export async function detectRedundancy(unitTests: ParsedTest[], e2eTests: ParsedTest[]): Promise<RedundancyWarning[]> {
    const redundancies: RedundancyWarning[] = [];

    // Early exit if no tests to compare
    if (unitTests.length === 0 || e2eTests.length === 0) {
        return redundancies;
    }

    console.log(`Analyzing redundancy between ${e2eTests.length} E2E tests and ${unitTests.length} Unit tests...`);

    for (const e2e of e2eTests) {
        // AI summarizes exactly what the E2E test validates
        const e2eIntent = await aiService.summarizeTestIntent(e2e.body);
        const e2eVector = await aiService.getEmbedding(e2eIntent);

        for (const unit of unitTests) {
            const unitIntent = await aiService.summarizeTestIntent(unit.body);
            const unitVector = await aiService.getEmbedding(unitIntent);

            // AI compares semantic overlap: Returns score 0.0 - 1.0
            if (e2eVector.length > 0 && unitVector.length > 0) {
                const overlapScore = cosineSimilarity(e2eVector, unitVector);

                // If similarity is extremely high, we flag it as redundant
                if (overlapScore > 0.88) {
                    redundancies.push({
                        warning: "High Redundancy Detected",
                        e2eTest: e2e.testName,
                        unitTest: unit.testName,
                        reason: `Semantic similarity is ${(overlapScore * 100).toFixed(1)}%. These tests verify the exact same logic.`,
                        suggestion: "Consider removing the E2E UI typing test if the Unit test handles validation safely, or abstract it to an API layer.",
                        overlapScore
                    });
                }
            }
        }
    }
    return redundancies;
}

// Math util
function cosineSimilarity(vecA: number[], vecB: number[]) {
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
