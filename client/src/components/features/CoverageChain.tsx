import { Feature, TestLayer } from "@/types";
import { cn } from "@/lib/utils";
import { Braces, Globe, Network } from "lucide-react";
import { motion } from "framer-motion";

interface CoverageChainProps {
    feature: Feature;
    onLayerSelect?: (layerName: "unit" | "api" | "e2e" | null) => void;
    selectedLayer?: "unit" | "api" | "e2e" | null;
}

const LAYER_COLORS = {
    unit: {
        gradient: "from-[var(--color-unit-start)] to-[var(--color-unit-end)]",
        icon: Braces,
        label: "Unit Tests",
    },
    api: {
        gradient: "from-[var(--color-api-start)] to-[var(--color-api-end)]",
        icon: Network,
        label: "API Tests",
    },
    e2e: {
        gradient: "from-[var(--color-e2e-start)] to-[var(--color-e2e-end)]",
        icon: Globe,
        label: "E2E Tests",
    },
};

export function CoverageChain({ feature, onLayerSelect, selectedLayer }: CoverageChainProps) {
    const layers = [feature.layers.unit, feature.layers.api, feature.layers.e2e];

    return (
        <div className="relative flex flex-col md:flex-row justify-between items-center w-full max-w-4xl mx-auto py-12">
            {/* Background Line */}
            <div className="absolute hidden md:block top-1/2 left-12 right-12 h-1 bg-slate-200 dark:bg-slate-800 transform -translate-y-1/2 z-0" />

            {/* Active Animated Gradient Line */}
            <motion.div
                className="absolute hidden md:block top-1/2 left-12 right-12 h-1 bg-gradient-to-r from-[var(--color-unit-start)] via-[var(--color-api-start)] to-[var(--color-e2e-end)] transform -translate-y-1/2 z-0"
                animate={{
                    opacity: [0.3, 0.6, 0.3],
                    boxShadow: ["0 0 0px rgba(0,0,0,0)", "0 0 10px rgba(59, 130, 246, 0.5)", "0 0 0px rgba(0,0,0,0)"]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Mobile Lines */}
            <div className="absolute md:hidden left-1/2 top-12 bottom-12 w-1 bg-gradient-to-b from-[var(--color-unit-start)] via-[var(--color-api-start)] to-[var(--color-e2e-end)] opacity-30 transform -translate-x-1/2 z-0" />

            {layers.map((layer, index) => (
                <ChainNode
                    key={layer.name}
                    layer={layer}
                    index={index}
                    isSelected={selectedLayer === layer.name}
                    isDimmed={selectedLayer !== null && selectedLayer !== layer.name}
                    onClick={() => onLayerSelect?.(selectedLayer === layer.name ? null : layer.name)}
                />
            ))}
        </div>
    );
}

function ChainNode({
    layer,
    index,
    isSelected,
    isDimmed,
    onClick
}: {
    layer: TestLayer;
    index: number;
    isSelected: boolean;
    isDimmed: boolean;
    onClick: () => void;
}) {
    const config = LAYER_COLORS[layer.name];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
                opacity: isDimmed ? 0.4 : 1,
                y: 0,
                scale: isSelected ? 1.05 : 1
            }}
            transition={{ delay: index * 0.1 }}
            className="relative z-10 group cursor-pointer"
            onClick={onClick}
        >
            <div className={cn(
                "w-64 h-24 rounded-full bg-gradient-to-br shadow-lg transition-all duration-300 flex items-center p-2 backdrop-blur-sm ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900",
                config.gradient,
                isSelected ? "ring-4 ring-primary/30 shadow-2xl" : "hover:shadow-xl hover:scale-105"
            )}>
                {/* Icon Circle */}
                <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-md">
                    <Icon className="text-white w-10 h-10" />
                </div>

                {/* Text Content */}
                <div className="flex-1 px-4 text-white">
                    <h3 className="font-bold text-lg leading-tight mb-1">{config.label}</h3>

                    <div className="flex items-center gap-2">
                        <span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                            {layer.count} tests
                        </span>
                        {layer.status === 'covered' && (
                            <span className="text-xs opacity-80">✓ Covered</span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
