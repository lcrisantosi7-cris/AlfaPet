import { CalendarDays } from "lucide-react";
import { BarChart } from "~/core/ui/charts/BarChart";
import { SectionCard } from "~/core/ui/SectionCard";
import type { WeekdayAppointments } from "../model/dashboard.types";

export function WeeklyAppointmentsCard({ data }: { data: readonly WeekdayAppointments[] }) {
  const chartData = data.map((d) => ({ label: d.day, value: d.total }));
  const summary = data.map((d) => `${d.day}: ${d.total}`).join(", ");

  return (
    <SectionCard title="Citas de la semana" icon={CalendarDays}>
      <BarChart data={chartData} ariaLabel={`Citas por día. ${summary}`} />
    </SectionCard>
  );
}
