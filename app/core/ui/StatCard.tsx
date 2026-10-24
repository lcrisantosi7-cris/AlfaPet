import { ChevronRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { cn } from "~/core/lib/cn";

const TONES = {
  orange: { card: "bg-tone-orange-soft", icon: "bg-tone-orange-icon text-tone-orange-fg" },
  blue: { card: "bg-tone-blue-soft", icon: "bg-tone-blue-icon text-tone-blue-fg" },
  green: { card: "bg-tone-green-soft", icon: "bg-tone-green-icon text-tone-green-fg" },
  purple: { card: "bg-tone-purple-soft", icon: "bg-tone-purple-icon text-tone-purple-fg" },
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
        "ui-stat-card flex flex-col gap-3 rounded-2xl border border-line p-4 hover:shadow-card",
        styles.card,
      )}
    >
      <span className={cn("flex size-11 items-center justify-center rounded-full", styles.icon)}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="text-3xl font-extrabold leading-none">{value}</span>
      <span className="flex items-center justify-between gap-2 text-sm text-ink-muted">
        {label}
        <ChevronRight className="ui-stat-chevron size-4 shrink-0" aria-hidden />
      </span>
    </Link>
  );
}
