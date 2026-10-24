import { CalendarDays, PawPrint, Package, Syringe, type LucideIcon } from "lucide-react";
import { ConfirmForm } from "~/core/feedback/ConfirmForm";
import { StatCard, type StatTone } from "~/core/ui/StatCard";
import { cn } from "~/core/lib/cn";
import type { DashboardStat, StatKind } from "../model/dashboard.types";

interface StatView {
  label: string;
  to: string;
  tone: StatTone;
  icon: LucideIcon;
}

const STAT_VIEW: Record<StatKind, StatView> = {
  patients: { label: "Pacientes registrados", to: "/pacientes", tone: "orange", icon: PawPrint },
  appointmentsToday: { label: "Citas hoy", to: "/citas", tone: "blue", icon: CalendarDays },
  pendingVaccines: { label: "Vacunas pendientes", to: "/vacunas", tone: "green", icon: Syringe },
  productsInStock: { label: "Productos en stock", to: "/productos", tone: "purple", icon: Package },
};

export function StatsGrid({ stats, columns = 4 }: { stats: readonly DashboardStat[]; columns?: 3 | 4 }) {
  return (
    <ul className={cn("stagger grid grid-cols-2 gap-3 sm:gap-4", columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4")}>
      {stats.map((stat) => (
        <li key={stat.kind}>
          <StatCard value={stat.value} {...STAT_VIEW[stat.kind]} />
        </li>
      ))}
    </ul>
  );
}
