import { Request, Response } from 'express';
import {
    calculateFeatureCost,
    generateRecommendations,
    getRecommendations,
    updateRecommendationStatus,
} from '../services/recommendationEngine';

const paramId = (req: Request, key: string = 'id'): string => {
    const val = req.params[key];
    return Array.isArray(val) ? val[0] : val;
};

export const getFeatureCost = async (req: Request, res: Response) => {
    try {
        const cost = await calculateFeatureCost(paramId(req));
        res.json(cost);
    } catch (error) {
        console.error('Failed to calculate cost:', error);
        res.status(500).json({ error: 'Failed to calculate cost' });
    }
};

export const triggerRecommendations = async (req: Request, res: Response) => {
    try {
        const recs = await generateRecommendations(paramId(req));
        res.json({ message: 'Recommendations generated', count: recs.length, recommendations: recs });
    } catch (error) {
        console.error('Failed to generate recommendations:', error);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
};

export const getFeatureRecommendations = async (req: Request, res: Response) => {
    try {
        const recs = await getRecommendations(paramId(req));
        res.json(recs);
    } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
};

export const patchRecommendation = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        if (!['accepted', 'rejected', 'done'].includes(status)) {
            return res.status(400).json({ error: 'status must be accepted, rejected, or done' });
        }
        const rec = await updateRecommendationStatus(paramId(req, 'recId'), status);
        res.json(rec);
    } catch (error) {
        console.error('Failed to update recommendation:', error);
        res.status(500).json({ error: 'Failed to update recommendation' });
    }
};
