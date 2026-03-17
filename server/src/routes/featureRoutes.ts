import { Router } from 'express';
import {
    getAllFeatures,
    getFeatureById,
    createFeature,
    deleteFeature,
    getScenarios,
    createScenario,
    getCoverageChains,
    getTestArtifacts,
    linkTest,
    getInsights,
} from '../controllers/featureController';
import { triggerScan, triggerInference, triggerAnalysis } from '../controllers/analysisController';
import {
    getFeatureCost,
    triggerRecommendations,
    getFeatureRecommendations,
    patchRecommendation,
} from '../controllers/optimizationController';

const router = Router();

// Features
router.get('/', getAllFeatures);
router.post('/', createFeature);
router.get('/test-artifacts', getTestArtifacts);
router.post('/scan', triggerScan);
router.get('/:id', getFeatureById);
router.delete('/:id', deleteFeature);

// Scenarios (nested under feature)
router.get('/:id/scenarios', getScenarios);
router.post('/:id/scenarios', createScenario);
router.get('/:id/coverage-chains', getCoverageChains);

// Inference & Analysis
router.post('/:id/infer', triggerInference);
router.post('/:id/analyze', triggerAnalysis);

// Optimization (Phase 4)
router.get('/:id/cost', getFeatureCost);
router.post('/:id/recommendations', triggerRecommendations);
router.get('/:id/recommendations', getFeatureRecommendations);
router.patch('/recommendations/:recId', patchRecommendation);

// Links & Insights
router.post('/links', linkTest);
router.get('/scenarios/:scenarioId/insights', getInsights);

export const featureRoutes = router;
