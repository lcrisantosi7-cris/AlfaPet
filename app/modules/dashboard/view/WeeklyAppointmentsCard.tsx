import { CalendarDays } from "lucide-react";
import { BarChart } from "~/core/ui/charts/BarChart";
import { EmptyState } from "~/core/ui/EmptyState";
import { SectionCard } from "~/core/ui/SectionCard";
import type { WeekdayAppointments } from "../model/dashboard.types";

export function WeeklyAppointmentsCard({ data }: { data: readonly WeekdayAppointments[] }) {
  const isEmpty = data.every((d) => d.total === 0);
  const chartData = data.map((d) => ({ label: d.day, value: d.total }));
  const summary = data.map((d) => `${d.day}: ${d.total}`).join(", ");

  return (
    <SectionCard title="Citas de la semana" icon={CalendarDays}>
      {isEmpty ? (
        <EmptyState icon={CalendarDays} title="Sin citas esta semana" />
      ) : (
        <BarChart data={chartData} ariaLabel={`Citas por día. ${summary}`} />
      )}
    </SectionCard>
  );
}