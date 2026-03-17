import { Feature } from '../types';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const apiKey = process.env.AI_API_KEY;
const baseURL = process.env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/';
const modelName = process.env.AI_MODEL_NAME || 'glm-4-plus';

let aiClient: OpenAI | null = null;
if (apiKey && apiKey !== 'your_key_here') {
    aiClient = new OpenAI({ apiKey, baseURL });
}

export class OptimizationEngine {
    private isAIEnabled(): boolean {
        return !!aiClient;
    }

    async generateMissingE2ETest(feature: Feature): Promise<string> {
        if (!this.isAIEnabled()) {
            return "// AI is not configured. Cannot generate code.";
        }

        // Gather API tests from scenarios
        const apiTests = feature.scenarios
            .flatMap(s => s.links)
            .map(l => l.testArtifact)
            .filter(t => t.layer === 'api');

        if (apiTests.length === 0) {
            return "// Cannot generate E2E test without reference API tests.";
        }

        const refTest = apiTests[0];

        const prompt = `
        You are an expert QA Engineer writing Playwright E2E tests.

        Feature: ${feature.name}
        Description: ${feature.description || 'N/A'}

        Reference API test: "${refTest.name}"
        Intent: ${refTest.intentSummary || refTest.name}

        Generate a Playwright E2E test that verifies the UI behavior for this feature.
        Use "@playwright/test", import "test" and "expect".
        Output ONLY TypeScript code without markdown.
        `;

        try {
            const completion = await aiClient!.chat.completions.create({
                model: modelName,
                messages: [{ role: 'user', content: prompt }]
            });

            let result = completion.choices[0].message.content || "";
            result = result.replace(/^```(typescript|ts)?/m, '').replace(/```$/m, '').trim();
            return result;
        } catch (error) {
            console.error('Optimization Engine Generation Failed:', error);
            return "// Error generating code.";
        }
    }
}
