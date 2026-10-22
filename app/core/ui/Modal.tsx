import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

/** Diálogo accesible sobre <dialog> nativo: foco atrapado, Esc cierra, fondo inerte. */
export function Modal({ open, onClose, title, children }: ModalProps) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            onClose={onClose}
            onClick={(event) => event.target === event.currentTarget && onClose()}
            className="m-auto max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-ink shadow-card backdrop:bg-black/50"
        >
            <div className="p-6 sm:p-8">
                <header className="mb-6 flex items-start justify-between gap-4">
                    <h2 id={titleId} className="text-xl font-extrabold">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-ink-muted hover:text-brand-text"
                    >
                        <X className="size-5" aria-hidden />
                    </button>
                </header>
                {children}
            </div>
        </dialog>
    );
}