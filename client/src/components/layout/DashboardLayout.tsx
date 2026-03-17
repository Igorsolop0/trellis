import { Link, useLocation } from "wouter";
import { Activity, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [location] = useLocation();

    return (
        <div className="noise-bg min-h-screen flex flex-col">
            <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
                <div className="max-w-[1400px] mx-auto flex h-14 items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="relative size-8 rounded-lg bg-gradient-to-br from-[var(--unit)] via-[var(--api)] to-[var(--e2e)] p-[1px]">
                            <div className="size-full rounded-[7px] bg-[var(--background)] flex items-center justify-center">
                                <Layers className="size-4 text-[var(--primary)]" />
                            </div>
                        </div>
                        <span className="font-semibold text-[15px] tracking-tight text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                            Trellis
                        </span>
                    </Link>

                    <nav className="flex items-center gap-1">
                        <Link href="/" className={cn(
                            "px-3 py-1.5 rounded-md text-[13px] font-medium transition-all",
                            location === "/"
                                ? "bg-[var(--secondary)] text-[var(--foreground)]"
                                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        )}>
                            Features
                        </Link>
                        <span className="px-3 py-1.5 text-[13px] font-medium text-[var(--muted-foreground)]/40 flex items-center gap-1.5">
                            <Activity className="size-3" />
                            Analytics
                        </span>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
