import type { ReactNode } from "react";
import { cn } from "~/core/lib/cn";

const VARIANTS = {
  success: "bg-tone-green-icon text-tone-green-fg",
  info: "bg-tone-blue-icon text-tone-blue-fg",
  warning: "bg-tone-amber-soft text-tone-amber-fg",
  danger: "bg-tone-red-soft text-tone-red-fg",
  brand: "bg-brand-soft text-brand-text",
  neutral: "bg-surface-muted text-ink-muted",
} as const;

export type BadgeVariant = keyof typeof VARIANTS;

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({ variant, children, dot = false, pulse = false }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", VARIANTS[variant])}>
      {dot && <span aria-hidden className={cn("size-1.5 rounded-full bg-current", pulse && "ui-dot-pulse")} />}
      {children}
    </span>
  );
}

/** Traduce el texto de estado de la base de datos a un color de Badge. */
export function statusVariant(status: string): { variant: BadgeVariant; pulse: boolean } {
  const value = status.toLowerCase();
  if (/(cancel|rechaz|inactiv|vencid)/.test(value)) return { variant: "danger", pulse: false };
  if (/(complet|atendid|aplicad|activ|confirm)/.test(value)) return { variant: "success", pulse: false };
  if (/(curso|proceso|atenci)/.test(value)) return { variant: "warning", pulse: true };
  if (/(pendient|program)/.test(value)) return { variant: "info", pulse: false };
  return { variant: "neutral", pulse: false };
}