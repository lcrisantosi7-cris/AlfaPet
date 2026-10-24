import { AlertTriangle, HelpCircle } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { cn } from "~/core/lib/cn";

export interface ConfirmCopy {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: "danger" | "default";
}

interface ConfirmDialogProps extends ConfirmCopy {
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    title,
    description,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    tone = "default",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const danger = tone === "danger";
    const Icon = danger ? AlertTriangle : HelpCircle;

    useEffect(() => {
        const dialog = ref.current;
        if (dialog && !dialog.open) dialog.showModal();
    }, []);

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            onCancel={(event) => {
                event.preventDefault();
                onCancel();
            }}
            onClick={(event) => event.target === event.currentTarget && onCancel()}
            className="ui-dialog m-auto w-[min(26rem,calc(100%-2rem))] rounded-3xl border border-line bg-surface p-0 text-ink shadow-card backdrop:bg-black/50"
        >
            <div className="flex flex-col items-center p-7 text-center">
                <span
                    className={cn(
                        "ui-pop flex size-14 items-center justify-center rounded-2xl",
                        danger ? "bg-tone-red-soft text-tone-red-fg" : "bg-brand-soft text-brand-text",
                    )}
                >
                    <Icon className="size-7" aria-hidden />
                </span>
                <h2 id={titleId} className="mt-4 text-lg font-extrabold">{title}</h2>
                {description && <p className="mt-1.5 text-sm leading-6 text-ink-muted">{description}</p>}
                <div className="mt-6 grid w-full grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="h-11 rounded-xl border border-line text-sm font-semibold hover:bg-surface-muted"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        autoFocus
                        onClick={onConfirm}
                        className={cn(
                            "h-11 rounded-xl text-sm font-bold text-white shadow-lg",
                            danger ? "bg-tone-red-fg shadow-tone-red-fg/25" : "bg-brand shadow-brand/25",
                        )}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </dialog>
    );
}