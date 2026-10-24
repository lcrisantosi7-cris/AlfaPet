import { ArrowUpRight, CalendarDays, ChartNoAxesCombined, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

interface AdminWelcomeBannerProps {
  firstName: string;
  appointmentsToday: number;
  todayLabel: string;
  action: ReactNode;
}

export function AdminWelcomeBanner({
  firstName,
  appointmentsToday,
  todayLabel,
  action,
}: AdminWelcomeBannerProps) {
  return (
    <section className="dashboard-enter rounded-2xl border border-line bg-surface px-5 py-5 shadow-card sm:px-7 sm:py-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-ink-muted">{todayLabel}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Buenos días, <span className="text-brand-text">{firstName}</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">
            Este es el resumen operativo de la clínica. Revisa la agenda, el inventario y la actividad reciente.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 text-sm font-medium">
              <CalendarDays className="size-4 text-brand-text" aria-hidden />
              {appointmentsToday} {appointmentsToday === 1 ? "cita hoy" : "citas hoy"}
            </span>
            <Link to="/reportes" className="ui-button inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold hover:border-brand/50">
              <ChartNoAxesCombined className="size-4" aria-hidden />
              Ver reportes
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
            <Link to="/personal" className="ui-button inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold hover:border-brand/50">
              <UsersRound className="size-4" aria-hidden />
              Personal
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 lg:justify-end">
          {action}
        </div>
      </div>
    </section>
  );
}