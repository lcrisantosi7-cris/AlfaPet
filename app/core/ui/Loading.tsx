import { PawPrint } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "~/core/lib/cn";

/** Devuelve true solo si `active` dura más de `delay` ms (evita parpadeos en cargas rápidas). */
export function useDelayedFlag(active: boolean, delay = 350) {
    const [flag, setFlag] = useState(false);
    useEffect(() => {
        if (!active) {
            setFlag(false);
            return;
        }
        const id = setTimeout(() => setFlag(true), delay);
        return () => clearTimeout(id);
    }, [active, delay]);
    return flag;
}

export function Skeleton({ className }: { className?: string }) {
    return <div aria-hidden className={cn("ui-skeleton", className)} />;
}

export function PawSpinner({ className }: { className?: string }) {
    return (
        <span aria-hidden className={cn("inline-flex items-center gap-1 text-brand", className)}>
            <PawPrint className="loading-paw size-4" />
            <PawPrint className="loading-paw size-4" />
            <PawPrint className="loading-paw size-4" />
        </span>
    );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: count }, (_, i) => (
                <li key={i} className="rounded-2xl border border-line bg-surface p-5">
                    <Skeleton className="size-12 rounded-2xl" />
                    <Skeleton className="mt-4 h-9 w-20" />
                    <Skeleton className="mt-3 h-4 w-32" />
                </li>
            ))}
        </ul>
    );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <div className="rounded-2xl border border-line bg-surface shadow-card">
            <div className="flex gap-3 border-b border-line p-4">
                <Skeleton className="h-11 flex-1" />
                <Skeleton className="hidden h-11 w-40 sm:block" />
            </div>
            <ul className="divide-y divide-line">
                {Array.from({ length: rows }, (_, i) => (
                    <li key={i} className="flex items-center gap-4 px-5 py-4">
                        <Skeleton className="size-10 shrink-0 rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/5" />
                        </div>
                        <Skeleton className="hidden h-4 w-24 sm:block" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function PageSkeleton({ variant = "table" }: { variant?: "dashboard" | "table" }) {
    return (
        <div role="status" aria-live="polite" className="page-skeleton-in mx-auto flex w-full max-w-[1500px] flex-col gap-6">
            <span className="sr-only">Cargando contenido…</span>
            {variant === "dashboard" ? (
                <>
                    <Skeleton className="h-52 rounded-[1.75rem]" />
                    <StatGridSkeleton />
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Skeleton className="h-72 rounded-2xl" />
                        <Skeleton className="h-72 rounded-2xl" />
                    </div>
                </>
            ) : (
                <>
                    <div className="space-y-3">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-9 w-56" />
                        <Skeleton className="h-4 w-full max-w-xl" />
                    </div>
                    <StatGridSkeleton count={3} />
                    <TableSkeleton />
                </>
            )}
        </div>
    );
}

/** Aviso discreto cuando una acción o navegación tarda más de lo normal. */
export function SlowNotice({ visible }: { visible: boolean }) {
    if (!visible) return null;
    return (
        <div
            role="status"
            className="slow-notice-in fixed bottom-4 left-4 z-[80] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm shadow-2xl shadow-black/15 lg:left-[17rem]"
        >
            <PawSpinner />
            <span>
                <span className="block font-bold">Esto está tardando un poco…</span>
                <span className="block text-xs text-ink-muted">Sigue en marcha, no cierres la página.</span>
            </span>
        </div>
    );
}