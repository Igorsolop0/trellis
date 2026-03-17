import { Request, Response } from 'express';
import path from 'path';
import { IngestionService } from '../services/ingestionService';
import { AIService } from '../services/aiService';
import { DataService } from '../services/dataService';
import { runInferencePipeline, analyzeExistingFeature } from '../services/inferenceEngine';

const ingestionService = new IngestionService(path.join(__dirname, '../../../'));
const aiService = new AIService();
const dataService = new DataService();

const paramId = (req: Request, key: string = 'id'): string => {
    const val = req.params[key];
    return Array.isArray(val) ? val[0] : val;
};

/** Scan repo and upsert test artifacts (no scenario linking) */
export const triggerScan = async (_req: Request, res: Response) => {
    try {
        console.log('Scanning repo...');
        const files = await ingestionService.scanRepository();

        let artifactCount = 0;
        for (const file of files) {
            const parsed = ingestionService.parseTestsFromFile(file);
            for (const test of parsed) {
                const layer = aiService.detectLayer(test.name, test.filepath);
                await dataService.upsertTestArtifact({
                    name: test.name,
                    layer,
                    filepath: test.filepath,
                    intentSummary: test.body?.substring(0, 500),
                });
                artifactCount++;
            }
        }

        res.json({
            message: 'Scan complete',
            scannedFiles: files.length,
            upsertedArtifacts: artifactCount,
        });
    } catch (error) {
        console.error('Scan failed:', error);
        res.status(500).json({ error: 'Failed to scan repository' });
    }
};

/** Run full inference pipeline: scan → cluster → link → insights */
export const triggerInference = async (req: Request, res: Response) => {
    try {
        const featureId = paramId(req);
        const repoPath = (req.body?.repoPath as string) || path.join(__dirname, '../../../');

        console.log(`[Inference] Starting for feature ${featureId}...`);
        const result = await runInferencePipeline(featureId, repoPath);

        res.json({
            message: 'Inference complete',
            ...result,
        });
    } catch (error) {
        console.error('Inference failed:', error);
        res.status(500).json({ error: 'Failed to run inference pipeline' });
    }
};

/** Analyze existing artifacts for a feature (no repo scan) */
export const triggerAnalysis = async (req: Request, res: Response) => {
    try {
        const featureId = paramId(req);

        console.log(`[Analysis] Analyzing existing artifacts for feature ${featureId}...`);
        const result = await analyzeExistingFeature(featureId);

        res.json({
            message: 'Analysis complete',
            ...result,
        });
    } catch (error) {
        console.error('Analysis failed:', error);
        res.status(500).json({ error: 'Failed to analyze feature' });
    }
};
