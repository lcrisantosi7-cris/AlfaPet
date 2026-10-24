import { CalendarDays, CheckCircle2, Clock3, PawPrint } from "lucide-react";
import { useFetcher, Link } from "react-router";
import { EmptyState } from "~/core/ui/EmptyState";
import { SectionCard } from "~/core/ui/SectionCard";
import type { VetAgendaAppointment } from "../model/dashboard.types";

interface AppointmentActionResult {
  ok: boolean;
  message: string;
}

interface VetAppointmentListProps {
  title: string;
  description: string;
  items: readonly VetAgendaAppointment[];
  mode: "assigned" | "unassigned";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    confirmada: "Confirmada",
    completada: "Atendida",
    cancelada: "Cancelada",
    cancelado: "Cancelada",
  };
  return labels[status.toLowerCase()] ?? status;
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "completada" || normalized === "completado") {
    return "bg-tone-green-soft text-tone-green-fg";
  }
  if (normalized === "cancelada" || normalized === "cancelado") {
    return "bg-tone-red-soft text-tone-red-fg";
  }
  if (normalized === "confirmada" || normalized === "confirmado") {
    return "bg-tone-blue-soft text-tone-blue-fg";
  }
  return "bg-tone-amber-soft text-tone-amber-fg";
}

export function VetAppointmentList({
  title,
  description,
  items,
  mode,
}: VetAppointmentListProps) {
  const fetcher = useFetcher<AppointmentActionResult>();
  const submittingId = String(fetcher.formData?.get("record_id") ?? "");
  const isUnassigned = mode === "unassigned";

  return (
    <SectionCard
      title={title}
      icon={isUnassigned ? Clock3 : CalendarDays}
      action={
        <Link className="ui-text-link text-sm font-semibold" to="/citas">
          Ver agenda <span aria-hidden>→</span>
        </Link>
      }
      className={isUnassigned ? "vet-list-unassigned" : "vet-list-assigned"}
      bodyClassName="pt-3"
    >
      <p className="mb-4 text-sm leading-6 text-ink-muted">{description}</p>

      {fetcher.data?.message && (
        <p
          className={
            "mb-4 rounded-xl border px-3.5 py-3 text-sm font-medium " +
            (fetcher.data.ok
              ? "border-tone-green-fg/20 bg-tone-green-soft text-tone-green-fg"
              : "border-tone-red-fg/20 bg-tone-red-soft text-tone-red-fg")
          }
          role={fetcher.data.ok ? "status" : "alert"}
          aria-live="polite"
        >
          {fetcher.data.message}
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={isUnassigned ? CheckCircle2 : PawPrint}
          title={isUnassigned ? "No hay citas pendientes sin asignar" : "No tienes citas asignadas para hoy"}
          description={
            isUnassigned
              ? "Todas las citas pendientes de hoy ya tienen veterinario o no hay nuevas por tomar."
              : "Cuando recepción te asigne una atención, aparecerá aquí ordenada por horario."
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const isSubmittingThis = submittingId === item.id && fetcher.state !== "idle";
            return (
              <li
                key={item.id}
                className="vet-appointment-row grid min-w-0 gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-[9.25rem_minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="flex items-center gap-3 sm:block">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text sm:hidden">
                    <Clock3 className="size-5" aria-hidden />
                  </span>
                  <time
                    dateTime={item.startsAt}
                    className="text-sm font-bold tabular-nums text-ink sm:text-base"
                  >
                    {item.scheduleLabel}
                  </time>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-bold tracking-tight">{item.petName}</h3>
                    <span className={"rounded-full px-2.5 py-1 text-xs font-semibold " + statusTone(item.status)}>
                      {statusLabel(item.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    {item.species} <span aria-hidden>·</span> {item.careType}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    Responsable: {item.ownerName}
                  </p>
                </div>

                <div className="flex items-center justify-end">
                  {isUnassigned ? (
                    <fetcher.Form method="post" action="/citas">
                      <input type="hidden" name="intent" value="take" />
                      <input type="hidden" name="record_id" value={item.id} />
                      <button
                        type="submit"
                        disabled={fetcher.state !== "idle"}
                        className="ui-button inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-on-brand shadow-sm shadow-brand/20 disabled:cursor-wait disabled:opacity-60"
                      >
                        {isSubmittingThis ? "Asignando…" : "Tomar cita"}
                      </button>
                    </fetcher.Form>
                  ) : (
                    <Link
                      to="/citas"
                      className="ui-button inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-muted"
                    >
                      Ver agenda
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}