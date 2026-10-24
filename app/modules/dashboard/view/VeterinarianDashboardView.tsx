import { CalendarDays, ClipboardCheck, Clock3 } from "lucide-react";
import { RecentPatientsCard } from "./RecentPatientsCard";
import { StatsGrid } from "./StatsGrid";
import { WeeklyAppointmentsCard } from "./WeeklyAppointmentsCard";
import { CareTypesCard } from "./CareTypesCard";
import { VetAppointmentList } from "./VetAppointmentList";
import type { DashboardSnapshot, VetAgenda } from "../model/dashboard.types";

interface VeterinarianDashboardViewProps {
  firstName: string;
  snapshot: DashboardSnapshot;
  agenda: VetAgenda;
}

const todayLabel = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Lima",
});

export function VeterinarianDashboardView({
  firstName,
  snapshot,
  agenda,
}: VeterinarianDashboardViewProps) {
  const today = todayLabel.format(new Date());
  const relevantStats = snapshot.stats.filter((stat) => stat.kind !== "productsInStock");

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="dashboard-enter relative isolate overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-brand-soft via-surface to-surface px-5 py-6 shadow-card sm:px-8 sm:py-7">
        <div aria-hidden className="absolute -right-12 -top-16 -z-10 size-64 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute right-6 top-6 hidden size-12 items-center justify-center rounded-2xl border border-brand/15 bg-surface/80 text-brand-text sm:flex">
          <CalendarDays className="size-6" aria-hidden />
        </div>
        <p className="mb-2 text-xs font-bold tracking-[0.16em] text-brand-text uppercase">
          Agenda clínica · {today}
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Hola, <span className="text-brand">{firstName}</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted sm:text-base">
          Empieza por tus atenciones asignadas. Después puedes revisar las citas pendientes que aún no tienen veterinario.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface/85 px-3.5 py-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-tone-blue-soft text-tone-blue-fg">
              <ClipboardCheck className="size-4" aria-hidden />
            </span>
            <span>
              <span className="block text-lg leading-tight font-extrabold tabular-nums">{agenda.assigned.length}</span>
              <span className="block text-xs text-ink-muted">Asignadas a mí</span>
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface/85 px-3.5 py-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-tone-amber-soft text-tone-amber-fg">
              <Clock3 className="size-4" aria-hidden />
            </span>
            <span>
              <span className="block text-lg leading-tight font-extrabold tabular-nums">{agenda.unassigned.length}</span>
              <span className="block text-xs text-ink-muted">Sin asignar hoy</span>
            </span>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-5">
        <VetAppointmentList
          title="Mis citas de hoy"
          description="Primero aparecen las atenciones asignadas a tu usuario, ordenadas por hora."
          items={agenda.assigned}
          mode="assigned"
        />
        <VetAppointmentList
          title="Citas sin asignar"
          description="Atenciones pendientes de hoy que puedes incorporar a tu agenda."
          items={agenda.unassigned}
          mode="unassigned"
        />
      </div>

      <StatsGrid stats={relevantStats} />

      <div className="grid gap-5 lg:grid-cols-2">
        <WeeklyAppointmentsCard data={snapshot.weekly} />
        <CareTypesCard shares={snapshot.careTypes} />
      </div>

      <RecentPatientsCard patients={snapshot.recentPatients} />
    </div>
  );
}