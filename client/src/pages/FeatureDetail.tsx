import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { featureService } from "@/services/featureService";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Zap, AlertTriangle, CheckCircle2, ChevronDown,
    FileCode2, Link2, Sparkles, FlaskConical, TrendingDown,
    ArrowRightLeft, Trash2, Plus, RefreshCw, Check, X, Timer, DollarSign, Github,
} from "lucide-react";
import { useState } from "react";
import type {
    BehaviorScenario, TestArtifact, OptimizationInsight,
    ScenarioLinkWithTest, TestLayer, CostBreakdown, Recommendation,
} from "@/types";

// ─── Constants ───

const LAYER_CONFIG: Record<TestLayer, { color: string; glow: string; label: string }> = {
    unit: { color: 'var(--unit)', glow: 'glow-unit', label: 'Unit' },
    api: { color: 'var(--api)', glow: 'glow-api', label: 'API' },
    e2e: { color: 'var(--e2e)', glow: 'glow-e2e', label: 'E2E' },
};

const SEVERITY_COLOR: Record<string, string> = {
    high: 'var(--severity-high)',
    medium: 'var(--severity-medium)',
    low: 'var(--severity-low)',
};

const INSIGHT_ICON: Record<string, string> = {
    missing_layer: '!',
    redundancy: '~',
    expensive_e2e: '$',
    weak_assertion: '?',
};

// ─── Components ───

function ConfidenceMeter({ value }: { value: number }) {
    const pct = Math.round(value * 100);
    const color = pct >= 70 ? 'var(--confidence-high)' : pct >= 40 ? 'var(--confidence-mid)' : 'var(--confidence-low)';
    return (
        <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                />
            </div>
            <span className="text-[11px] font-mono" style={{ color }}>{pct}%</span>
        </div>
    );
}

function LayerNode({ layer, count, active }: { layer: TestLayer; count: number; active: boolean }) {
    const cfg = LAYER_CONFIG[layer];
    return (
        <motion.div
            className={`relative flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border transition-all ${
                active ? cfg.glow : ''
            }`}
            style={{
                borderColor: active ? cfg.color : 'var(--border)',
                backgroundColor: active ? `color-mix(in srgb, ${cfg.color} 8%, var(--card))` : 'var(--card)',
            }}
            whileHover={{ scale: 1.02 }}
        >
            <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: cfg.color }}>
                {cfg.label}
            </span>
            <span className="text-xl font-bold font-mono text-[var(--foreground)]">{count}</span>
            <span className="text-[10px] text-[var(--muted-foreground)]">tests</span>
        </motion.div>
    );
}

function CoverageChainMini({ scenario }: { scenario: BehaviorScenario }) {
    const counts = { unit: 0, api: 0, e2e: 0 };
    scenario.links.forEach(l => {
        const layer = l.testArtifact.layer;
        if (layer in counts) counts[layer as TestLayer]++;
    });

    return (
        <div className="flex items-center gap-2">
            {(['unit', 'api', 'e2e'] as const).map((layer, i) => (
                <div key={layer} className="flex items-center">
                    <LayerNode layer={layer} count={counts[layer]} active={counts[layer] > 0} />
                    {i < 2 && (
                        <div className="w-6 h-px mx-1" style={{
                            background: counts[layer] > 0 && counts[(['unit', 'api', 'e2e'] as const)[i + 1]] > 0
                                ? `linear-gradient(to right, ${LAYER_CONFIG[layer].color}, ${LAYER_CONFIG[(['unit', 'api', 'e2e'] as const)[i + 1]].color})`
                                : 'var(--border)',
                        }} />
                    )}
                </div>
            ))}
        </div>
    );
}

function TestArtifactRow({ link }: { link: ScenarioLinkWithTest }) {
    const t = link.testArtifact;
    const cfg = LAYER_CONFIG[t.layer];

    return (
        <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--secondary)] transition-colors group">
            <div
                className="size-2 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: cfg.color }}
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[var(--foreground)] truncate">
                        {t.name}
                    </span>
                    {link.linkType === 'duplicates' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--severity-medium)]/10 text-[var(--severity-medium)] font-mono">
                            DUP
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    {t.filepath && (
                        <span className="text-[11px] font-mono text-[var(--muted-foreground)] truncate flex items-center gap-1">
                            <FileCode2 className="size-3 shrink-0" />
                            {t.filepath}
                        </span>
                    )}
                    {t.framework && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--muted-foreground)]">
                            {t.framework}
                        </span>
                    )}
                    {t.testType && t.testType !== 'unknown' && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            t.testType === 'behavior' ? 'bg-[var(--confidence-high)]/10 text-[var(--confidence-high)]' :
                            t.testType === 'non_functional' ? 'bg-[var(--api)]/10 text-[var(--api)]' :
                            'bg-[var(--muted)] text-[var(--muted-foreground)]'
                        }`}>
                            {t.testType === 'behavior' ? 'BHV' : t.testType === 'implementation' ? 'IMPL' : 'NFR'}
                        </span>
                    )}
                </div>
                {link.rationale && (
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link2 className="size-3" />
                        {link.rationale}
                    </div>
                )}
            </div>
            <ConfidenceMeter value={link.confidence} />
        </div>
    );
}

function InsightCard({ insight }: { insight: OptimizationInsight }) {
    return (
        <div className="flex gap-3 px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)]">
            <div
                className="size-6 rounded-md flex items-center justify-center text-[11px] font-bold font-mono shrink-0"
                style={{
                    backgroundColor: `color-mix(in srgb, ${SEVERITY_COLOR[insight.severity]} 12%, transparent)`,
                    color: SEVERITY_COLOR[insight.severity],
                }}
            >
                {INSIGHT_ICON[insight.type] || '!'}
            </div>
            <div className="min-w-0">
                <p className="text-[13px] text-[var(--foreground)]">{insight.summary}</p>
                {insight.recommendation && (
                    <p className="text-[11px] text-[var(--muted-foreground)] mt-1">{insight.recommendation}</p>
                )}
            </div>
        </div>
    );
}

function ScenarioSection({ scenario, index }: { scenario: BehaviorScenario; index: number }) {
    const [expanded, setExpanded] = useState(true);

    const unitLinks = scenario.links.filter(l => l.testArtifact.layer === 'unit');
    const apiLinks = scenario.links.filter(l => l.testArtifact.layer === 'api');
    const e2eLinks = scenario.links.filter(l => l.testArtifact.layer === 'e2e');

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.35 }}
            className="gradient-border rounded-2xl overflow-hidden"
        >
            <div className="bg-[var(--card)] rounded-2xl">
                {/* Scenario header */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--card-hover)] transition-colors"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="size-8 rounded-lg bg-gradient-to-br from-[var(--unit)] via-[var(--api)] to-[var(--e2e)] opacity-80 flex items-center justify-center text-white text-[12px] font-bold">
                            {index + 1}
                        </div>
                        <div className="text-left min-w-0">
                            <h3 className="text-[15px] font-semibold text-[var(--foreground)] truncate">
                                {scenario.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                                    {scenario.links.length} tests
                                </span>
                                <span className="text-[11px] text-[var(--muted-foreground)]">
                                    {scenario.source}
                                </span>
                                {scenario.insights.length > 0 && (
                                    <span className="flex items-center gap-0.5 text-[11px] text-[var(--severity-medium)]">
                                        <AlertTriangle className="size-3" />
                                        {scenario.insights.length}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <ConfidenceMeter value={scenario.confidence} />
                        <ChevronDown className={`size-4 text-[var(--muted-foreground)] transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                        >
                            <div className="px-5 pb-5 space-y-4">
                                {/* Coverage chain */}
                                <div className="flex justify-center py-3">
                                    <CoverageChainMini scenario={scenario} />
                                </div>

                                {/* Test lists by layer */}
                                {[
                                    { layer: 'unit' as TestLayer, links: unitLinks },
                                    { layer: 'api' as TestLayer, links: apiLinks },
                                    { layer: 'e2e' as TestLayer, links: e2eLinks },
                                ].filter(g => g.links.length > 0).map(group => (
                                    <div key={group.layer}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="size-2 rounded-full" style={{ backgroundColor: LAYER_CONFIG[group.layer].color }} />
                                            <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: LAYER_CONFIG[group.layer].color }}>
                                                {LAYER_CONFIG[group.layer].label}
                                            </span>
                                            <span className="text-[11px] text-[var(--muted-foreground)]">
                                                ({group.links.length})
                                            </span>
                                        </div>
                                        <div className="space-y-0.5">
                                            {group.links.map(link => (
                                                <TestArtifactRow key={link.id} link={link} />
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Insights */}
                                {scenario.insights.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="size-3 text-[var(--severity-medium)]" />
                                            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--severity-medium)]">
                                                Insights
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {scenario.insights.map(insight => (
                                                <InsightCard key={insight.id} insight={insight} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ─── Optimization Components ───

const ACTION_CONFIG: Record<string, { icon: typeof ArrowRightLeft; label: string; color: string }> = {
    move_to_api: { icon: ArrowRightLeft, label: 'Move to API', color: 'var(--api)' },
    move_to_unit: { icon: ArrowRightLeft, label: 'Move to Unit', color: 'var(--unit)' },
    remove_duplicate: { icon: Trash2, label: 'Remove Duplicate', color: 'var(--severity-high)' },
    add_lower_level: { icon: Plus, label: 'Add Lower Level', color: 'var(--confidence-high)' },
    migrate_framework: { icon: RefreshCw, label: 'Migrate Framework', color: 'var(--severity-medium)' },
    keep_at_layer: { icon: Check, label: 'Keep', color: 'var(--muted-foreground)' },
};

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
}

function CostPanel({ cost }: { cost: CostBreakdown }) {
    const maxCost = Math.max(...cost.byLayer.map(l => l.costMs), 1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Timer className="size-4 text-[var(--muted-foreground)]" />
                    <h3 className="text-[13px] font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
                        Pipeline Cost
                    </h3>
                </div>
                <div className="text-right">
                    <span className="text-xl font-bold font-mono text-[var(--foreground)]">
                        {formatDuration(cost.totalCostMs)}
                    </span>
                    <span className="text-[11px] text-[var(--muted-foreground)] ml-1">total</span>
                </div>
            </div>

            {/* Layer bars */}
            <div className="space-y-3">
                {cost.byLayer.map(layer => (
                    <div key={layer.layer}>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full" style={{ backgroundColor: LAYER_CONFIG[layer.layer].color }} />
                                <span className="text-[12px] font-mono" style={{ color: LAYER_CONFIG[layer.layer].color }}>
                                    {LAYER_CONFIG[layer.layer].label}
                                </span>
                                <span className="text-[11px] text-[var(--muted-foreground)]">
                                    {layer.testCount} tests
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                                    avg {formatDuration(layer.avgDuration)}
                                </span>
                                <span className="text-[12px] font-mono font-medium text-[var(--foreground)]">
                                    {formatDuration(layer.costMs)}
                                </span>
                                <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                                    {layer.percentage}%
                                </span>
                            </div>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--secondary)] overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: LAYER_CONFIG[layer.layer].color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${(layer.costMs / maxCost) * 100}%` }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Potential savings */}
            {cost.potentialSavingMs > 0 && (
                <div className="mt-4 px-3 py-2.5 rounded-lg border border-[var(--confidence-high)]/15 bg-[var(--confidence-high)]/5 flex items-center gap-2">
                    <TrendingDown className="size-4 text-[var(--confidence-high)]" />
                    <span className="text-[13px] text-[var(--confidence-high)]">
                        Potential saving: <strong className="font-mono">{formatDuration(cost.potentialSavingMs)}</strong>
                        <span className="text-[11px] ml-1 opacity-70">({cost.potentialSavingPercent}% of total)</span>
                    </span>
                </div>
            )}
        </motion.div>
    );
}

function RecommendationRow({ rec, onAction }: {
    rec: Recommendation;
    onAction: (id: string, status: 'accepted' | 'rejected') => void;
}) {
    const config = ACTION_CONFIG[rec.action] || ACTION_CONFIG.keep_at_layer;
    const Icon = config.icon;

    return (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition-colors">
            <div
                className="size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{
                    backgroundColor: `color-mix(in srgb, ${config.color} 10%, transparent)`,
                    color: config.color,
                }}
            >
                <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12px] font-mono font-medium" style={{ color: config.color }}>
                        {config.label}
                    </span>
                    {rec.fromLayer && rec.toLayer && (
                        <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                            {rec.fromLayer} → {rec.toLayer}
                        </span>
                    )}
                    {rec.estimatedSavingMs > 0 && (
                        <span className="flex items-center gap-0.5 text-[11px] font-mono text-[var(--confidence-high)]">
                            <DollarSign className="size-3" />
                            -{formatDuration(rec.estimatedSavingMs)}
                        </span>
                    )}
                </div>
                <p className="text-[13px] text-[var(--foreground)] leading-relaxed">{rec.reason}</p>
                {rec.testArtifact && (
                    <span className="text-[11px] font-mono text-[var(--muted-foreground)] mt-1 flex items-center gap-1">
                        <FileCode2 className="size-3" />
                        {rec.testArtifact.name}
                    </span>
                )}
            </div>
            {rec.status === 'pending' && (
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => onAction(rec.id, 'accepted')}
                        className="size-7 rounded-md flex items-center justify-center hover:bg-[var(--confidence-high)]/10 text-[var(--confidence-high)] transition-colors"
                        title="Accept"
                    >
                        <Check className="size-4" />
                    </button>
                    <button
                        onClick={() => onAction(rec.id, 'rejected')}
                        className="size-7 rounded-md flex items-center justify-center hover:bg-[var(--severity-high)]/10 text-[var(--muted-foreground)] hover:text-[var(--severity-high)] transition-colors"
                        title="Reject"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            )}
            {rec.status !== 'pending' && (
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md shrink-0 ${
                    rec.status === 'accepted' ? 'bg-[var(--confidence-high)]/10 text-[var(--confidence-high)]' :
                    rec.status === 'done' ? 'bg-[var(--confidence-high)]/10 text-[var(--confidence-high)]' :
                    'bg-[var(--secondary)] text-[var(--muted-foreground)]'
                }`}>
                    {rec.status}
                </span>
            )}
        </div>
    );
}

function OptimizationPanel({ featureId }: { featureId: string }) {
    const queryClient = useQueryClient();

    const { data: cost } = useQuery({
        queryKey: ['cost', featureId],
        queryFn: () => featureService.getFeatureCost(featureId),
    });

    const { data: recommendations } = useQuery({
        queryKey: ['recommendations', featureId],
        queryFn: () => featureService.getRecommendations(featureId),
    });

    const genMutation = useMutation({
        mutationFn: () => featureService.generateRecommendations(featureId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recommendations', featureId] });
            queryClient.invalidateQueries({ queryKey: ['cost', featureId] });
        },
    });

    const actionMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) =>
            featureService.updateRecommendation(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recommendations', featureId] });
            queryClient.invalidateQueries({ queryKey: ['cost', featureId] });
        },
    });

    const pendingCount = recommendations?.filter(r => r.status === 'pending').length ?? 0;
    const totalSaving = recommendations
        ?.filter(r => r.status === 'pending')
        .reduce((s, r) => s + r.estimatedSavingMs, 0) ?? 0;

    return (
        <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-2">
                    <TrendingDown className="size-3.5" />
                    Optimization
                </h2>
                <button
                    onClick={() => genMutation.mutate()}
                    disabled={genMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)] disabled:opacity-50 transition-all"
                >
                    <Sparkles className="size-3" />
                    {genMutation.isPending ? 'Generating...' : 'Generate Recommendations'}
                </button>
            </div>

            {/* Cost breakdown */}
            {cost && cost.totalTests > 0 && <CostPanel cost={cost} />}

            {/* Recommendations */}
            {recommendations && recommendations.length > 0 && (
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-[12px] text-[var(--muted-foreground)]">
                            {pendingCount} pending recommendations
                        </span>
                        {totalSaving > 0 && (
                            <span className="text-[12px] font-mono text-[var(--confidence-high)]">
                                {formatDuration(totalSaving)} potential savings
                            </span>
                        )}
                    </div>
                    <div className="space-y-2">
                        {recommendations.map(rec => (
                            <RecommendationRow
                                key={rec.id}
                                rec={rec}
                                onAction={(id, status) => actionMutation.mutate({ id, status })}
                            />
                        ))}
                    </div>
                </div>
            )}

            {(!recommendations || recommendations.length === 0) && (!cost || cost.totalTests === 0) && (
                <div className="text-center py-10 border border-dashed border-[var(--border)] rounded-2xl">
                    <TrendingDown className="size-8 mx-auto mb-2 text-[var(--muted-foreground)] opacity-30" />
                    <p className="text-[14px] text-[var(--muted-foreground)]">
                        Run inference first, then generate recommendations
                    </p>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ───

export default function FeatureDetail() {
    const [, params] = useRoute("/feature/:id");
    const featureId = params?.id;
    const queryClient = useQueryClient();

    const { data: feature, isLoading } = useQuery({
        queryKey: ['feature', featureId],
        queryFn: () => featureService.getFeatureById(featureId!),
        enabled: !!featureId,
    });

    const [githubRepo, setGithubRepo] = useState('');

    const inferMutation = useMutation({
        mutationFn: () => featureService.triggerInference(featureId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feature', featureId] });
            queryClient.invalidateQueries({ queryKey: ['features'] });
        },
    });

    const githubMutation = useMutation({
        mutationFn: () => featureService.triggerGitHubInference(featureId!, githubRepo),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feature', featureId] });
            queryClient.invalidateQueries({ queryKey: ['features'] });
        },
    });

    if (isLoading) {
        return (
            <div className="max-w-[1400px] mx-auto px-6 py-10">
                <div className="space-y-4">
                    <div className="h-8 w-48 rounded-lg bg-[var(--card)] animate-pulse" />
                    <div className="h-32 rounded-2xl bg-[var(--card)] animate-pulse" />
                    <div className="h-64 rounded-2xl bg-[var(--card)] animate-pulse" />
                </div>
            </div>
        );
    }

    if (!feature) {
        return (
            <div className="max-w-[1400px] mx-auto px-6 py-20 text-center text-[var(--muted-foreground)]">
                Feature not found
            </div>
        );
    }

    const totalTests = feature.scenarios.reduce((s, sc) => s + sc.links.length, 0);
    const totalInsights = feature.scenarios.reduce((s, sc) => s + sc.insights.length, 0);
    const layers = new Set(feature.scenarios.flatMap(s => s.links.map(l => l.testArtifact.layer)));

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-10">
            {/* Back nav */}
            <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-6">
                <ArrowLeft className="size-3.5" />
                Features
            </Link>

            {/* Feature header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                                {feature.name}
                            </h1>
                            {feature.category && (
                                <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--secondary)] text-[var(--muted-foreground)]">
                                    {feature.category}
                                </span>
                            )}
                        </div>
                        {feature.description && (
                            <p className="text-[var(--muted-foreground)] mt-1 text-[14px]">{feature.description}</p>
                        )}
                    </div>
                    <button
                        onClick={() => inferMutation.mutate()}
                        disabled={inferMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
                    >
                        <Zap className="size-3.5" />
                        {inferMutation.isPending ? 'Running...' : 'Run Inference'}
                    </button>
                </div>

                {/* Quick stats */}
                <div className="flex items-center gap-6 mt-4">
                    <div className="flex items-center gap-1.5 text-[13px]">
                        <FlaskConical className="size-3.5 text-[var(--muted-foreground)]" />
                        <span className="font-mono font-medium text-[var(--foreground)]">{feature.scenarios.length}</span>
                        <span className="text-[var(--muted-foreground)]">scenarios</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[13px]">
                        <CheckCircle2 className="size-3.5 text-[var(--muted-foreground)]" />
                        <span className="font-mono font-medium text-[var(--foreground)]">{totalTests}</span>
                        <span className="text-[var(--muted-foreground)]">tests</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[13px]">
                        <Sparkles className="size-3.5 text-[var(--severity-medium)]" />
                        <span className="font-mono font-medium text-[var(--severity-medium)]">{totalInsights}</span>
                        <span className="text-[var(--muted-foreground)]">insights</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {(['unit', 'api', 'e2e'] as const).map(l => (
                            <div key={l} className="flex items-center gap-1">
                                <div
                                    className="size-2 rounded-full"
                                    style={{
                                        backgroundColor: layers.has(l) ? LAYER_CONFIG[l].color : 'var(--muted)',
                                        opacity: layers.has(l) ? 1 : 0.3,
                                    }}
                                />
                                <span className="text-[11px] font-mono" style={{ color: layers.has(l) ? LAYER_CONFIG[l].color : 'var(--muted-foreground)' }}>
                                    {LAYER_CONFIG[l].label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Inference result toast */}
                {inferMutation.isSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 px-4 py-3 rounded-xl border border-[var(--e2e)]/20 bg-[var(--e2e)]/5 text-[13px] text-[var(--e2e)]"
                    >
                        Inference complete: {inferMutation.data.scenariosCreated} scenarios, {inferMutation.data.linksCreated} links, {inferMutation.data.insightsCreated} insights
                    </motion.div>
                )}

                {/* GitHub integration */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <Github className="size-4 text-[var(--muted-foreground)] shrink-0" />
                    <input
                        type="text"
                        placeholder="owner/repo"
                        value={githubRepo || feature.githubRepoUrl || ''}
                        onChange={e => setGithubRepo(e.target.value)}
                        className="w-64 px-3 py-1.5 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-mono"
                    />
                    <button
                        onClick={() => githubMutation.mutate()}
                        disabled={!(githubRepo || feature.githubRepoUrl)?.includes('/') || githubMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)] disabled:opacity-40 transition-all"
                    >
                        <Github className="size-3" />
                        {githubMutation.isPending ? 'Scanning...' : 'Scan GitHub'}
                    </button>
                    {feature.githubRepoUrl && !githubRepo && (
                        <span className="text-[11px] text-[var(--muted-foreground)]">
                            connected
                        </span>
                    )}
                </div>

                {githubMutation.isSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 px-4 py-3 rounded-xl border border-[var(--e2e)]/20 bg-[var(--e2e)]/5 text-[13px] text-[var(--e2e)]"
                    >
                        GitHub scan complete: {githubMutation.data.scenariosCreated} scenarios, {githubMutation.data.linksCreated} links, {githubMutation.data.insightsCreated} insights
                    </motion.div>
                )}

                {githubMutation.isError && (
                    <div className="mt-3 px-4 py-3 rounded-xl border border-[var(--severity-high)]/20 bg-[var(--severity-high)]/5 text-[13px] text-[var(--severity-high)]">
                        Failed to scan repo. Check that the repo exists and is accessible.
                    </div>
                )}
            </motion.div>

            {/* Scenarios */}
            {feature.scenarios.length > 0 ? (
                <div className="space-y-3">
                    <h2 className="text-[13px] font-mono uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
                        Behavior Scenarios
                    </h2>
                    {feature.scenarios.map((scenario, i) => (
                        <ScenarioSection key={scenario.id} scenario={scenario} index={i} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-2xl">
                    <FlaskConical className="size-10 mx-auto mb-3 text-[var(--muted-foreground)] opacity-30" />
                    <p className="text-lg font-medium text-[var(--muted-foreground)]">No scenarios yet</p>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1 mb-4">
                        Run inference to auto-discover behavior scenarios from your test files
                    </p>
                    <button
                        onClick={() => inferMutation.mutate()}
                        disabled={inferMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        <Zap className="size-3.5" />
                        {inferMutation.isPending ? 'Running...' : 'Run Inference'}
                    </button>
                </div>
            )}

            {/* Optimization Panel */}
            {feature.scenarios.length > 0 && featureId && (
                <OptimizationPanel featureId={featureId} />
            )}
        </div>
    );
}
