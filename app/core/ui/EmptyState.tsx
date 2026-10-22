import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand-text">
                <Icon className="size-6" aria-hidden />
            </span>
            <p className="font-bold">{title}</p>
            {description && <p className="max-w-xs text-sm text-ink-muted">{description}</p>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}