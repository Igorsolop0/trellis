import { Request, Response } from 'express';
import { FileParserService } from '../services/fileParserService';
import { AIService } from '../services/aiService';
import { DataService } from '../services/dataService';

const aiService = new AIService();
const dataService = new DataService();

export const uploadTestFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const content = req.file.buffer.toString('utf-8');
        const filename = req.file.originalname;

        console.log(`Processing uploaded file: ${filename}`);

        // 1. Parse tests from file
        const parsed = FileParserService.parseTestsFromContent(content, filename);

        // 2. Upsert each as a TestArtifact
        const artifacts = [];
        for (const test of parsed) {
            const layer = aiService.detectLayer(test.name, test.filepath);
            const artifact = await dataService.upsertTestArtifact({
                name: test.name,
                layer,
                filepath: test.filepath,
                intentSummary: test.body?.substring(0, 500),
            });
            artifacts.push(artifact);
        }

        res.json({
            message: 'File processed successfully',
            filename,
            foundTests: parsed.length,
            artifacts,
        });
    } catch (error) {
        console.error('Error processing upload:', error);
        res.status(500).json({ error: 'Failed to process file' });
    }
};
