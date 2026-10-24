import { ChevronRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { cn } from "~/core/lib/cn";
import { CountUp } from "./CountUp";

const TONES = {
  orange: { icon: "bg-tone-orange-icon text-tone-orange-fg", card: "from-tone-orange-soft" },
  blue: { icon: "bg-tone-blue-icon text-tone-blue-fg", card: "from-tone-blue-soft" },
  green: { icon: "bg-tone-green-icon text-tone-green-fg", card: "from-tone-green-soft" },
  purple: { icon: "bg-tone-purple-icon text-tone-purple-fg", card: "from-tone-purple-soft" },
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
        "ui-stat-card group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-line bg-gradient-to-br to-surface p-4 sm:p-5",
        styles.card,
      )}
    >
      <span className={cn("ui-wiggle flex size-11 items-center justify-center rounded-2xl shadow-sm sm:size-12", styles.icon)}>
        <Icon className="size-6" aria-hidden />
      </span>
      <CountUp value={value} className="text-4xl font-extrabold leading-none tracking-tight tabular-nums text-ink" />
      <span className="flex items-center justify-between gap-2 text-sm font-semibold text-ink-muted">
        {label}
        <ChevronRight className="ui-stat-chevron size-4 shrink-0 text-ink-muted/70 group-hover:text-brand" aria-hidden />
      </span>
    </Link>
  );
}