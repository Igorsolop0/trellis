import type {
    Feature,
    FeatureSummary,
    ScenarioCoverageChain,
    BehaviorScenario,
    InferenceResult,
    TestArtifact,
    CostBreakdown,
    Recommendation,
} from '../types';

const API_BASE = 'http://localhost:4000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json();
}

export const featureService = {
    // Features
    getAllFeatures: () => request<FeatureSummary[]>('/features'),

    getFeatureById: (id: string) => request<Feature>(`/features/${id}`),

    createFeature: (data: { name: string; description?: string; category?: string }) =>
        request<Feature>('/features', { method: 'POST', body: JSON.stringify(data) }),

    deleteFeature: (id: string) =>
        request<{ message: string }>(`/features/${id}`, { method: 'DELETE' }),

    // Scenarios
    getScenarios: (featureId: string) =>
        request<BehaviorScenario[]>(`/features/${featureId}/scenarios`),

    createScenario: (featureId: string, data: { title: string; summary?: string }) =>
        request<BehaviorScenario>(`/features/${featureId}/scenarios`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getCoverageChains: (featureId: string) =>
        request<ScenarioCoverageChain[]>(`/features/${featureId}/coverage-chains`),

    // Analysis
    triggerInference: (featureId: string, repoPath?: string) =>
        request<InferenceResult>(`/features/${featureId}/infer`, {
            method: 'POST',
            body: JSON.stringify({ repoPath }),
        }),

    triggerGitHubInference: (featureId: string, githubRepo: string) =>
        request<InferenceResult>(`/features/${featureId}/infer-github`, {
            method: 'POST',
            body: JSON.stringify({ githubRepo }),
        }),

    triggerAnalysis: (featureId: string) =>
        request<InferenceResult>(`/features/${featureId}/analyze`, { method: 'POST' }),

    scanGitHubRepo: (githubRepo: string) =>
        request<InferenceResult & { featureId: string }>('/features/scan-github', {
            method: 'POST',
            body: JSON.stringify({ githubRepo }),
        }),

    triggerScan: () => request<{ message: string; scannedFiles: number; upsertedArtifacts: number }>(
        '/features/scan', { method: 'POST' },
    ),

    // Test Artifacts
    getTestArtifacts: () => request<TestArtifact[]>('/features/test-artifacts'),

    // Links
    linkTest: (data: { scenarioId: string; testArtifactId: string; confidence?: number; rationale?: string; linkType?: string }) =>
        request<{ message: string }>('/features/links', { method: 'POST', body: JSON.stringify(data) }),

    // Optimization (Phase 4)
    getFeatureCost: (featureId: string) =>
        request<CostBreakdown>(`/features/${featureId}/cost`),

    generateRecommendations: (featureId: string) =>
        request<{ message: string; count: number; recommendations: Recommendation[] }>(`/features/${featureId}/recommendations`, { method: 'POST' }),

    getRecommendations: (featureId: string) =>
        request<Recommendation[]>(`/features/${featureId}/recommendations`),

    updateRecommendation: (recId: string, status: 'accepted' | 'rejected' | 'done') =>
        request<Recommendation>(`/features/recommendations/${recId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),

    // Upload
    uploadTestFile: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
    },
};
