import { Activity } from "lucide-react";
import type { NavIconName } from "~/core/config/navigation";
import { NAV_ICONS } from "~/core/layout/nav-icons";

interface ModulePlaceholderProps {
  label: string;
  icon: NavIconName;
}

export function ModulePlaceholder({ label, icon }: ModulePlaceholderProps) {
  const Icon = NAV_ICONS[icon] ?? Activity;

  return (
    <section className="mx-auto mt-16 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand-text">
        <Icon className="size-7" aria-hidden />
      </span>
      <h1 className="text-xl font-bold">{label}</h1>
      <p className="text-sm text-ink-muted">Este módulo se construirá en una siguiente fase.</p>
    </section>
  );
}
