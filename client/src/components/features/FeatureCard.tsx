import { Link } from "wouter";
import { FeatureSummary } from "@/types/dashboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Braces, Globe, Network, Trash2 } from "lucide-react";


interface FeatureCardProps {
    feature: FeatureSummary;
    onDelete?: (id: string) => void;
}

export function FeatureCard({ feature, onDelete }: FeatureCardProps) {
    return (
        <div className="relative group">
            <Link href={`/feature/${feature.id}`}>
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-slate-200 dark:border-slate-800 h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <Badge variant="outline" className="text-xs font-normal border-primary/20 bg-primary/5 text-primary mb-1">
                                {feature.category}
                            </Badge>
                            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                                {feature.name}
                            </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant={feature.status === 'controlled' ? 'success' : feature.status === 'at_risk' ? 'destructive' : 'warning'}
                                className="capitalize"
                            >
                                {feature.status.replace('_', ' ')}
                            </Badge>
                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (confirm("Are you sure you want to delete this feature and all its tests?")) {
                                            onDelete(feature.id);
                                        }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Feature"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-2 mt-4">
                            <div className="flex flex-col items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                <Braces className="w-4 h-4 text-blue-600 mb-1" />
                                <span className="text-xs text-muted-foreground">Unit</span>
                                <span className="font-bold text-sm">{feature.unitTestCount}</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                <Network className="w-4 h-4 text-purple-600 mb-1" />
                                <span className="text-xs text-muted-foreground">API</span>
                                <span className="font-bold text-sm">{feature.apiTestCount}</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                <Globe className="w-4 h-4 text-cyan-600 mb-1" />
                                <span className="text-xs text-muted-foreground">E2E</span>
                                <span className="font-bold text-sm">{feature.e2eTestCount}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                            <div className="flex gap-3">
                                {feature.duplicationCount > 0 && (
                                    <span className="text-amber-600 dark:text-amber-400 font-medium text-xs">
                                        {feature.duplicationCount} Duplications
                                    </span>
                                )}
                                {feature.gapCount > 0 && (
                                    <span className="text-red-600 dark:text-red-400 font-medium text-xs">
                                        {feature.gapCount} Gaps
                                    </span>
                                )}
                            </div>
                            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>
    );
}
