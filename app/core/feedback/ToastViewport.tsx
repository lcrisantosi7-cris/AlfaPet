import { AlertTriangle, CheckCircle2, Info, X, XCircle, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "~/core/lib/cn";
import { dismissToast, toastStore, type Toast, type ToastTone } from "./toast-store";

const TONES: Record<ToastTone, { Icon: LucideIcon; icon: string; bar: string }> = {
    success: { Icon: CheckCircle2, icon: "bg-tone-green-icon text-tone-green-fg", bar: "bg-tone-green-fg" },
    error: { Icon: XCircle, icon: "bg-tone-red-soft text-tone-red-fg", bar: "bg-tone-red-fg" },
    warning: { Icon: AlertTriangle, icon: "bg-tone-amber-soft text-tone-amber-fg", bar: "bg-tone-amber-fg" },
    info: { Icon: Info, icon: "bg-tone-blue-icon text-tone-blue-fg", bar: "bg-tone-blue-fg" },
};

export function ToastViewport() {
    const toasts = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, toastStore.getServerSnapshot);

    return (
        <div
            aria-live="polite"
            className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-stretch gap-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[24rem]"
        >
            {toasts.map((item) => (
                <ToastItem key={item.id} toast={item} />
            ))}
        </div>
    );
}

function ToastItem({ toast }: { toast: Toast }) {
    const { Icon, icon, bar } = TONES[toast.tone];
    const [leaving, setLeaving] = useState(false);
    const [paused, setPaused] = useState(false);
    const remaining = useRef(toast.duration);
    const startedAt = useRef(0);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const close = useCallback(() => {
        setLeaving(true);
        setTimeout(() => dismissToast(toast.id), 180);
    }, [toast.id]);

    const start = useCallback(() => {
        startedAt.current = Date.now();
        timer.current = setTimeout(close, Math.max(remaining.current, 800));
        setPaused(false);
    }, [close]);

    const pause = useCallback(() => {
        clearTimeout(timer.current);
        remaining.current -= Date.now() - startedAt.current;
        setPaused(true);
    }, []);

    useEffect(() => {
        start();
        return () => clearTimeout(timer.current);
    }, [start]);

    return (
        <div
            role={toast.tone === "error" || toast.tone === "warning" ? "alert" : "status"}
            onMouseEnter={pause}
            onMouseLeave={start}
            onFocus={pause}
            onBlur={start}
            className={cn(
                "pointer-events-auto relative overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/15",
                leaving ? "toast-leave" : "toast-enter",
            )}
        >
            <div className="flex items-start gap-3 p-4 pr-10">
                <span className={cn("ui-pop flex size-10 shrink-0 items-center justify-center rounded-xl", icon)}>
                    <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-bold leading-5">{toast.title}</p>
                    {toast.description && <p className="mt-0.5 text-xs leading-5 text-ink-muted">{toast.description}</p>}
                    {toast.action && (
                        <button
                            type="button"
                            onClick={() => {
                                toast.action?.onClick();
                                close();
                            }}
                            className="mt-2 rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-text hover:bg-brand hover:text-on-brand"
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>
            </div>
            <button
                type="button"
                onClick={close}
                aria-label="Cerrar aviso"
                className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-ink"
            >
                <X className="size-4" aria-hidden />
            </button>
            <span
                aria-hidden
                className={cn("toast-bar absolute inset-x-0 bottom-0 h-1 opacity-70", bar)}
                style={{ animationDuration: `${toast.duration}ms`, animationPlayState: paused ? "paused" : "running" }}
            />
        </div>
    );
}