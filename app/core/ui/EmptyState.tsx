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
        <div className="ui-empty-state flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="ui-float flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-text shadow-sm">
                <Icon className="size-7" aria-hidden />
            </span>
            <p className="mt-1 font-bold">{title}</p>
            {description && <p className="max-w-xs text-sm text-ink-muted">{description}</p>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}