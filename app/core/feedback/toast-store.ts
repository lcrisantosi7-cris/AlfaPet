export type ToastTone = "success" | "error" | "warning" | "info";

export interface Toast {
    id: string;
    tone: ToastTone;
    title: string;
    description?: string;
    duration: number;
    action?: { label: string; onClick: () => void };
}

type Listener = () => void;
const EMPTY: readonly Toast[] = [];
const MAX_VISIBLE = 4;

let toasts: readonly Toast[] = EMPTY;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((listener) => listener());

export const toastStore = {
    subscribe(listener: Listener) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
    getSnapshot: () => toasts,
    getServerSnapshot: () => EMPTY,
};

interface ToastInput {
    tone: ToastTone;
    title: string;
    description?: string;
    duration?: number;
    action?: Toast["action"];
}

export function showToast({ duration = 4500, ...input }: ToastInput) {
    const id = crypto.randomUUID();
    toasts = [...toasts, { id, duration, ...input }].slice(-MAX_VISIBLE);
    emit();
    return id;
}

export function dismissToast(id: string) {
    toasts = toasts.filter((item) => item.id !== id);
    emit();
}

type Shortcut = (title: string, description?: string, extra?: Pick<ToastInput, "duration" | "action">) => string;
const make = (tone: ToastTone): Shortcut => (title, description, extra) =>
    showToast({ tone, title, description, ...extra });

export const toast = {
    success: make("success"),
    error: make("error"),
    warning: make("warning"),
    info: make("info"),
};