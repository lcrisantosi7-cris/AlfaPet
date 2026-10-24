import { ChevronRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { cn } from "~/core/lib/cn";

const TONES = {
  orange: { icon: "bg-tone-orange-icon text-tone-orange-fg" },
  blue: { icon: "bg-tone-blue-icon text-tone-blue-fg" },
  green: { icon: "bg-tone-green-icon text-tone-green-fg" },
  purple: { icon: "bg-tone-purple-icon text-tone-purple-fg" },
} as const;

export type StatTone = keyof typeof TONES;

interface StatCardProps {
  label: string;
  value: number;
  to: string;
  tone: StatTone;
  icon: LucideIcon;
}

export function StatCard({ label, value, to, tone, icon: Icon }: StatCardProps) {
  const styles = TONES[tone];

  return (
    <Link
      to={to}
      className={cn(
        "ui-stat-card group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgb(59_29_14_/_0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:p-5",
      )}
    >
      <span className={cn("flex size-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 sm:size-11", styles.icon)}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="text-3xl font-extrabold leading-none tracking-tight text-ink">{value}</span>
      <span className="flex items-center justify-between gap-2 text-sm font-medium text-ink-muted">
        {label}
        <ChevronRight className="ui-stat-chevron size-4 shrink-0 text-ink-muted/70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden />
      </span>
    </Link>
  );
}
