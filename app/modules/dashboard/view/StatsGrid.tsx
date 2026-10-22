import { CalendarDays, PawPrint, Package, Syringe, type LucideIcon } from "lucide-react";
import { StatCard, type StatTone } from "~/core/ui/StatCard";
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

export function StatsGrid({ stats }: { stats: readonly DashboardStat[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <li key={stat.kind}>
          <StatCard value={stat.value} {...STAT_VIEW[stat.kind]} />
        </li>
      ))}
    </ul>
  );
}
