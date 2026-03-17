import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { Feature, TestArtifact, TestLayer } from '../types';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const apiKey = process.env.AI_API_KEY;
const baseURL = process.env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/';
const modelName = process.env.AI_MODEL_NAME || 'glm-4-plus';
const embeddingModel = process.env.AI_EMBEDDING_MODEL || 'embedding-3';

let aiClient: OpenAI | null = null;
if (apiKey && apiKey !== 'your_key_here') {
    const heliconeKey = process.env.HELICONE_API_KEY;

    if (heliconeKey) {
        aiClient = new OpenAI({
            apiKey,
            baseURL: "https://oai.hconeai.com/v1",
            defaultHeaders: {
                "Helicone-Auth": `Bearer ${heliconeKey}`,
                "Helicone-Property-Project": "Trellis"
            }
        });
    } else {
        aiClient = new OpenAI({ apiKey, baseURL });
    }
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

    async getEmbedding(text: string): Promise<number[]> {
        if (!this.isAIEnabled()) return [];
        try {
            const response = await aiClient!.embeddings.create({
                model: embeddingModel,
                input: text,
            });
            return response.data[0].embedding;
        } catch (error) {
            console.error('Failed to get embedding:', error);
            return [];
        }
    }

    async summarizeTestIntent(testBody: string): Promise<string> {
        if (!this.isAIEnabled()) return testBody;
        try {
            const prompt = `Summarize what this test verifies. Be precise, focus on the assertions and user intent.
             Test Code:
             ${testBody.substring(0, 1000)}

             Return ONLY the summary.`;
            const completion = await aiClient!.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: modelName,
            });
            return completion.choices[0].message.content || testBody;
        } catch {
            return testBody;
        }
    }

    detectLayer(testName: string, filePath: string): TestLayer {
        const lower = (testName + filePath).toLowerCase();
        if (lower.includes('e2e') || lower.includes('playwright') || lower.includes('cypress')) return 'e2e';
        if (lower.includes('api') || lower.includes('supertest') || lower.includes('.spec.')) return 'api';
        return 'unit';
    }

    // Phase 2 stubs — will be replaced with real inference engine
    async inferScenarios(_feature: Feature, _artifacts: TestArtifact[]): Promise<{ title: string; summary: string; confidence: number }[]> {
        // TODO Phase 2: clustering via embeddings + AST analysis
        return [];
    }

    async suggestLinks(_scenarioTitle: string, _artifacts: TestArtifact[]): Promise<{ testArtifactId: string; confidence: number; rationale: string }[]> {
        // TODO Phase 2: semantic similarity matching
        return [];
    }
}
