import { Request, Response } from 'express';
import { DataService } from '../services/dataService';

const dataService = new DataService();

const paramId = (req: Request, key: string = 'id'): string => {
    const val = req.params[key];
    return Array.isArray(val) ? val[0] : val;
};

// ─── Features ───

export const getAllFeatures = async (_req: Request, res: Response) => {
    try {
        const summaries = await dataService.getFeatureSummaries();
        res.json(summaries);
    } catch (error) {
        console.error('Failed to fetch features:', error);
        res.status(500).json({ error: 'Failed to fetch features' });
    }
};

export const getFeatureById = async (req: Request, res: Response) => {
    try {
        const feature = await dataService.getFeatureById(paramId(req));
        if (!feature) {
            return res.status(404).json({ message: 'Feature not found' });
        }
        res.json(feature);
    } catch (error) {
        console.error('Failed to fetch feature:', error);
        res.status(500).json({ error: 'Failed to fetch feature' });
    }
};

export const createFeature = async (req: Request, res: Response) => {
    try {
        const { name, description, category } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'name is required' });
        }
        const feature = await dataService.createFeature({ name, description, category });
        res.status(201).json(feature);
    } catch (error) {
        console.error('Failed to create feature:', error);
        res.status(500).json({ error: 'Failed to create feature' });
    }
};

export const deleteFeature = async (req: Request, res: Response) => {
    try {
        const success = await dataService.deleteFeature(paramId(req));
        if (success) {
            res.json({ message: 'Feature deleted' });
        } else {
            res.status(404).json({ message: 'Feature not found' });
        }
    } catch (error) {
        console.error('Failed to delete feature:', error);
        res.status(500).json({ error: 'Failed to delete feature' });
    }
};

// ─── Scenarios ───

export const getScenarios = async (req: Request, res: Response) => {
    try {
        const scenarios = await dataService.getScenariosByFeature(paramId(req));
        res.json(scenarios);
    } catch (error) {
        console.error('Failed to fetch scenarios:', error);
        res.status(500).json({ error: 'Failed to fetch scenarios' });
    }
};

export const createScenario = async (req: Request, res: Response) => {
    try {
        const { title, summary, confidence, source } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'title is required' });
        }
        const scenario = await dataService.createScenario({
            featureId: paramId(req),
            title,
            summary,
            confidence,
            source,
        });
        res.status(201).json(scenario);
    } catch (error) {
        console.error('Failed to create scenario:', error);
        res.status(500).json({ error: 'Failed to create scenario' });
    }
};

// ─── Coverage Chains ───

export const getCoverageChains = async (req: Request, res: Response) => {
    try {
        const chains = await dataService.getCoverageChains(paramId(req));
        res.json(chains);
    } catch (error) {
        console.error('Failed to fetch coverage chains:', error);
        res.status(500).json({ error: 'Failed to fetch coverage chains' });
    }
};

// ─── Test Artifacts ───

export const getTestArtifacts = async (_req: Request, res: Response) => {
    try {
        const artifacts = await dataService.getAllTestArtifacts();
        res.json(artifacts);
    } catch (error) {
        console.error('Failed to fetch test artifacts:', error);
        res.status(500).json({ error: 'Failed to fetch test artifacts' });
    }
};

// ─── Scenario Links ───

export const linkTest = async (req: Request, res: Response) => {
    try {
        const { scenarioId, testArtifactId, confidence, rationale, linkType } = req.body;
        if (!scenarioId || !testArtifactId) {
            return res.status(400).json({ error: 'scenarioId and testArtifactId are required' });
        }
        await dataService.linkTestToScenario({ scenarioId, testArtifactId, confidence, rationale, linkType });
        res.status(201).json({ message: 'Link created' });
    } catch (error) {
        console.error('Failed to link test:', error);
        res.status(500).json({ error: 'Failed to link test to scenario' });
    }
};

// ─── Insights ───

export const getInsights = async (req: Request, res: Response) => {
    try {
        const insights = await dataService.getInsightsByScenario(paramId(req, 'scenarioId'));
        res.json(insights);
    } catch (error) {
        console.error('Failed to fetch insights:', error);
        res.status(500).json({ error: 'Failed to fetch insights' });
    }
};
