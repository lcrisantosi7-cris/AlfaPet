import type { ReactNode } from "react";
import { cn } from "~/core/lib/cn";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

/** Encabezado compartido para conservar una jerarquía visual uniforme entre módulos. */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col justify-between gap-4 sm:flex-row sm:items-end",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-xs font-bold tracking-[0.14em] text-brand-text uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">
          {description}
        </p>
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}