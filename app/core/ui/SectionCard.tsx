import type { LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "~/core/lib/cn";

interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/** Tarjeta estándar del sistema: encabezado con icono + acción opcional + contenido. */
export function SectionCard({
  title,
  icon: Icon,
  action,
  className,
  bodyClassName,
  children,
}: SectionCardProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn("ui-card rounded-2xl border border-line bg-surface shadow-card", className)}
    >
      <header className="flex items-center justify-between gap-3 px-5 pt-5">
        <h2 id={titleId} className="flex items-center gap-2.5 text-base font-bold">
          <Icon className="size-5 text-brand" aria-hidden />
          {title}
        </h2>
        {action}
      </header>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
