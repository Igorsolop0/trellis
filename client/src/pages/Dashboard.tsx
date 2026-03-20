import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { featureService } from "@/services/featureService";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Plus, ArrowRight, FlaskConical, Layers, AlertTriangle, Sparkles, Github, Search, Loader2 } from "lucide-react";
import type { FeatureSummary } from "@/types";
import { useState } from "react";

const layerColor: Record<string, string> = {
    unit: 'var(--unit)',
    api: 'var(--api)',
    e2e: 'var(--e2e)',
};

function CoverageDots({ testCount }: { testCount: { unit: number; api: number; e2e: number } }) {
    return (
        <div className="flex gap-1.5">
            {(['unit', 'api', 'e2e'] as const).map(layer => (
                <div
                    key={layer}
                    className="flex items-center gap-1"
                    title={`${layer}: ${testCount[layer]} tests`}
                >
                    <div
                        className="size-2 rounded-full transition-all"
                        style={{
                            backgroundColor: testCount[layer] > 0 ? layerColor[layer] : 'var(--muted)',
                            opacity: testCount[layer] > 0 ? 1 : 0.3,
                        }}
                    />
                    <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                        {testCount[layer]}
                    </span>
                </div>
            ))}
        </div>
    );
}

function StatusIndicator({ status }: { status: string }) {
    const config: Record<string, { color: string; label: string }> = {
        full: { color: 'var(--e2e)', label: 'Full' },
        partial: { color: 'var(--severity-medium)', label: 'Partial' },
        minimal: { color: 'var(--severity-high)', label: 'Minimal' },
    };
    const c = config[status] || config.minimal;
    return (
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider" style={{ color: c.color }}>
            <span className="size-1.5 rounded-full" style={{ backgroundColor: c.color }} />
            {c.label}
        </span>
    );
}

function FeatureRow({ feature, index }: { feature: FeatureSummary; index: number }) {
    const totalTests = feature.testCount.unit + feature.testCount.api + feature.testCount.e2e;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
        >
            <Link href={`/feature/${feature.id}`}>
                <div className="group relative flex items-center justify-between px-5 py-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition-all cursor-pointer">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="shrink-0">
                            <StatusIndicator status={feature.coverageStatus} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[15px] font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                                {feature.name}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                                {feature.category && (
                                    <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
                                        {feature.category}
                                    </span>
                                )}
                                <span className="text-[11px] text-[var(--muted-foreground)]">
                                    {feature.scenarioCount} scenarios
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-6">
                        <CoverageDots testCount={feature.testCount} />
                        <span className="font-mono text-sm text-[var(--muted-foreground)]">
                            {totalTests} tests
                        </span>
                        {totalTests > 0 && (
                            <span
                                className="text-[11px] font-mono px-1.5 py-0.5 rounded"
                                style={{
                                    backgroundColor: `color-mix(in srgb, ${feature.behaviorScore >= 0.6 ? 'var(--confidence-high)' : feature.behaviorScore >= 0.3 ? 'var(--confidence-mid)' : 'var(--severity-high)'} 10%, transparent)`,
                                    color: feature.behaviorScore >= 0.6 ? 'var(--confidence-high)' : feature.behaviorScore >= 0.3 ? 'var(--confidence-mid)' : 'var(--severity-high)',
                                }}
                                title="Behavior Coverage Score — % of tests that verify user behavior vs implementation"
                            >
                                {Math.round(feature.behaviorScore * 100)}% behavior
                            </span>
                        )}
                        {feature.insightCount > 0 && (
                            <span className="flex items-center gap-1 text-[12px] text-[var(--severity-medium)]">
                                <AlertTriangle className="size-3" />
                                {feature.insightCount}
                            </span>
                        )}
                    </div>

                    <ArrowRight className="size-4 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ml-4" />
                </div>
            </Link>
        </motion.div>
    );
}

export default function Dashboard() {
    const queryClient = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [githubRepo, setGithubRepo] = useState('');

    const { data: features, isLoading } = useQuery({
        queryKey: ['features'],
        queryFn: featureService.getAllFeatures,
    });

    const createMutation = useMutation({
        mutationFn: () => featureService.createFeature({ name: newName, category: newCategory || undefined }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['features'] });
            setShowCreate(false);
            setNewName('');
            setNewCategory('');
        },
    });

    const scanMutation = useMutation({
        mutationFn: () => featureService.scanGitHubRepo(githubRepo.trim()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['features'] });
        },
    });

    const totalTests = features?.reduce((s, f) => s + f.testCount.unit + f.testCount.api + f.testCount.e2e, 0) ?? 0;
    const totalScenarios = features?.reduce((s, f) => s + f.scenarioCount, 0) ?? 0;
    const totalInsights = features?.reduce((s, f) => s + f.insightCount, 0) ?? 0;

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-10">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
                    Test Traceability
                </h1>
                <p className="text-[var(--muted-foreground)] mt-1.5 text-[15px] mb-6">
                    Behavior-based coverage across unit, API, and E2E layers
                </p>

                <div className="flex gap-3 items-center">
                    <div className="relative flex-1 max-w-lg">
                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)]" />
                        <input
                            type="text"
                            placeholder="owner/repo"
                            value={githubRepo}
                            onChange={e => setGithubRepo(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && githubRepo.trim() && !scanMutation.isPending && scanMutation.mutate()}
                            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                        />
                    </div>
                    <button
                        onClick={() => scanMutation.mutate()}
                        disabled={!githubRepo.trim() || scanMutation.isPending}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] disabled:opacity-40 hover:opacity-90 transition-opacity"
                    >
                        {scanMutation.isPending ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Scanning...
                            </>
                        ) : (
                            <>
                                <Search className="size-4" />
                                Scan
                            </>
                        )}
                    </button>
                </div>
                {scanMutation.isError && (
                    <p className="text-[var(--severity-high)] text-sm mt-2">
                        Failed to scan repository. Check the repo format (owner/repo) and try again.
                    </p>
                )}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {[
                    { label: 'Features', value: features?.length ?? 0, icon: Layers },
                    { label: 'Scenarios', value: totalScenarios, icon: FlaskConical },
                    { label: 'Tests', value: totalTests, icon: FlaskConical },
                    { label: 'Insights', value: totalInsights, icon: Sparkles, accent: totalInsights > 0 },
                ].map((stat) => (
                    <div key={stat.label} className="px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
                            {stat.label}
                        </div>
                        <div className={`text-2xl font-bold font-mono ${stat.accent ? 'text-[var(--severity-medium)]' : 'text-[var(--foreground)]'}`}>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </motion.div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[13px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
                    Features
                </h2>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
                >
                    <Plus className="size-3.5" />
                    New Feature
                </button>
            </div>

            {showCreate && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Feature name..."
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                            onKeyDown={e => e.key === 'Enter' && newName && createMutation.mutate()}
                        />
                        <input
                            type="text"
                            placeholder="Category"
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            className="w-40 px-3 py-2 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        />
                        <button
                            onClick={() => newName && createMutation.mutate()}
                            disabled={!newName || createMutation.isPending}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] disabled:opacity-40 hover:opacity-90 transition-opacity"
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </motion.div>
            )}

            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-[72px] rounded-xl bg-[var(--card)] animate-pulse" />
                    ))}
                </div>
            ) : features && features.length > 0 ? (
                <div className="space-y-2">
                    {features.map((f, i) => (
                        <FeatureRow key={f.id} feature={f} index={i} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-[var(--muted-foreground)]">
                    <Github className="size-10 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No features yet</p>
                    <p className="text-sm mt-1">Enter a GitHub repository above and click Scan to get started</p>
                </div>
            )}
        </div>
    );
}
