import { CalendarCheck, CalendarClock, CalendarDays, CalendarX2, Clock3, PawPrint, Search, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Form, useActionData, useSubmit } from "react-router";
import { ConfirmForm } from "~/core/feedback/ConfirmForm";
import { useActionToast } from "~/core/feedback/use-action-toast";
import { Badge, statusVariant } from "~/core/ui/Badge";
import { PageHeader } from "~/core/ui/PageHeader";
import { AppointmentDialog } from "./AppointmentDialog";

type Appointment = {
  id: string; startsAt: string; status: string; notes: string | null; patientId?: string; vetId?: string | null;
  careTypeId?: number; patientName?: string; species: string; ownerName?: string; careType?: string; vetName?: string;
};
type Props = {
  appointments: Appointment[];
  filters: { from: string; to: string; status: string };
  careTypes: { id: number; label: string }[];
  vets: { id: string; full_name: string }[];
  userRole: string;
  patients: { id: string; name: string }[];
};

const STATUSES = ["pendiente", "confirmada", "completada", "cancelada"];
const statusLabel = (v: string) => (v === "completada" ? "Atendida" : v.charAt(0).toUpperCase() + v.slice(1));
const dateTime = (v: string) => new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v));
const CHIPS = [["todas", "Todas"], ["pendiente", "Pendientes"], ["confirmada", "Confirmadas"], ["completada", "Atendidas"], ["cancelada", "Canceladas"], ["expirada", "Expiradas"]] as const;
const INPUT = "ui-field h-11 rounded-xl border border-line bg-bg px-3 text-sm";

export function CitasView({ appointments, filters, careTypes, vets, patients, userRole }: Props) {
  const result = useActionData() as { ok?: boolean; message?: string } | undefined;
  useActionToast(result);
  const submit = useSubmit();
  const [now, setNow] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [chip, setChip] = useState<(typeof CHIPS)[number][0]>("todas");
  const [vetFilter, setVetFilter] = useState("todos");
  const isVet = userRole === "veterinario";

  useEffect(() => setNow(Date.now()), [appointments]);

  const expired = (a: Appointment) => now !== null && (a.status === "pendiente" || a.status === "confirmada") && new Date(a.startsAt).getTime() < now;
  const availableVets = useMemo(() => [...new Set(appointments.map((a) => a.vetName).filter((v): v is string => Boolean(v)))].sort(), [appointments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("es");
    return appointments.filter((a) => {
      const isExp = expired(a);
      const okChip = chip === "todas" || (chip === "expirada" ? isExp : a.status === chip && !isExp);
      const okVet = vetFilter === "todos" || (a.vetName || "Sin asignar") === vetFilter;
      const okQ = !q || [a.patientName, a.ownerName, a.vetName, a.careType, a.notes].some((v) => v?.toLocaleLowerCase("es").includes(q));
      return okChip && okVet && okQ;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, search, chip, vetFilter, now]);

  const today = new Date().toDateString();
  const kpis = [
    { label: "Hoy", value: appointments.filter((a) => new Date(a.startsAt).toDateString() === today).length, icon: CalendarDays, tone: "bg-tone-orange-icon text-tone-orange-fg" },
    { label: "Pendientes", value: appointments.filter((a) => a.status === "pendiente" && !expired(a)).length, icon: CalendarClock, tone: "bg-tone-blue-icon text-tone-blue-fg" },
    { label: "Atendidas", value: appointments.filter((a) => a.status === "completada").length, icon: CalendarCheck, tone: "bg-tone-green-icon text-tone-green-fg" },
    { label: "Expiradas", value: appointments.filter(expired).length, icon: CalendarX2, tone: "bg-tone-red-soft text-tone-red-fg" },
  ];

  return (
    <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
      <PageHeader
        eyebrow="Gestión asistencial"
        title="Citas y agenda"
        description="Las citas pasadas sin atender se marcan como expiradas automáticamente (solo visual)."
        action={!isVet ? <AppointmentDialog mode="create" patients={patients} careTypes={careTypes} vets={vets} /> : null}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="ui-card flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
            <span className={`flex size-12 items-center justify-center rounded-xl ${tone}`}><Icon className="size-6" aria-hidden /></span>
            <div><p className="text-2xl font-extrabold leading-none">{value}</p><p className="mt-1 text-xs text-ink-muted">{label}</p></div>
          </article>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="flex flex-col gap-3 border-b border-line p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1">
              <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar paciente, dueño, veterinario o atención…" className={`${INPUT} w-full pl-10`} />
            </label>
            <select aria-label="Veterinario" value={vetFilter} onChange={(e) => setVetFilter(e.target.value)} className={INPUT}>
              <option value="todos">Todos los veterinarios</option><option value="Sin asignar">Sin asignar</option>
              {availableVets.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <Form method="get" className="flex items-center gap-2">
              <input type="date" name="desde" defaultValue={filters.from} aria-label="Desde" className={INPUT} />
              <input type="date" name="hasta" defaultValue={filters.to} aria-label="Hasta" className={INPUT} />
              <button type="submit" className="ui-button h-11 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-surface-muted">Filtrar</button>
            </Form>
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl bg-surface-muted p-1">
            {CHIPS.map(([key, label]) => (
              <button key={key} type="button" onClick={() => setChip(key)} className={`ui-button h-9 rounded-lg px-3 text-xs font-semibold ${chip === key ? "bg-brand text-on-brand shadow-sm" : "text-ink-muted hover:text-ink"}`}>{label}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-text"><CalendarDays className="size-7" /></span>
            <h2 className="mt-4 text-lg font-bold">No hay citas para mostrar</h2>
            <p className="mt-1 max-w-md text-sm text-ink-muted">Cambia los filtros o el rango de fechas.</p>
          </div>
        ) : (
          <div className="ui-table-wrap">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink-muted">
                <tr><th className="px-5 py-4">Fecha y hora</th><th className="px-5 py-4">Paciente</th><th className="px-5 py-4">Atención</th><th className="px-5 py-4">Veterinario</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((a) => {
                  const isExp = expired(a);
                  const v = statusVariant(a.status);
                  const staffCanSet = !isVet || (isVet && a.vetId);
                  return (
                    <tr key={a.id} className={isExp ? "bg-tone-red-soft/50" : "transition-colors hover:bg-surface-muted/70"}>
                      <td className="px-5 py-4"><span className={`flex items-center gap-2 font-semibold ${isExp ? "text-tone-red-fg" : ""}`}><Clock3 className="size-4" />{dateTime(a.startsAt)}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-text"><PawPrint className="size-5" /></span>
                          <div><p className="font-bold">{a.patientName || "Paciente no disponible"}</p><p className="text-xs text-ink-muted">{a.ownerName || "—"} · {a.species}</p></div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><p className="font-medium">{a.careType || "Atención general"}</p>{a.notes && <p className="mt-1 max-w-xs truncate text-xs text-ink-muted">{a.notes}</p>}</td>
                      <td className="px-5 py-4"><span className="inline-flex items-center gap-2"><UserRound className="size-4 text-ink-muted" />{a.vetName || "Sin asignar"}</span></td>
                      <td className="px-5 py-4">
                        {isExp ? <div className="flex flex-col items-start gap-1"><Badge variant="danger" dot>Fecha expirada</Badge><span className="text-[11px] text-tone-red-fg">Cancelada (vista)</span></div>
                          : <Badge variant={v.variant} pulse={v.pulse} dot>{statusLabel(a.status)}</Badge>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex min-w-44 flex-wrap items-center gap-2">
                          {isVet && a.status === "pendiente" && !a.vetId && !isExp && (
                            <Form method="post"><input type="hidden" name="intent" value="take" /><input type="hidden" name="record_id" value={a.id} /><button type="submit" className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-on-brand">Tomar cita</button></Form>
                          )}
                          {staffCanSet && (
                            <Form method="post">
                              <input type="hidden" name="intent" value="change-status" /><input type="hidden" name="record_id" value={a.id} />
                              <select name="status" aria-label="Cambiar estado" defaultValue={a.status} onChange={(e) => submit(e.currentTarget.form)} className="h-9 rounded-lg border border-line bg-bg px-2 text-xs">
                                {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                              </select>
                            </Form>
                          )}
                          {!isVet && (
                            <>
                              <AppointmentDialog mode="edit" appointment={a} patients={patients} careTypes={careTypes} vets={vets} />
                              <ConfirmForm method="post" confirm={{ tone: "danger", title: "¿Eliminar esta cita?", description: "Esta acción no se puede deshacer.", confirmLabel: "Sí, eliminar" }}>
                                <input type="hidden" name="intent" value="delete" /><input type="hidden" name="record_id" value={a.id} />
                                <button type="submit" aria-label="Eliminar cita" className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-ink-muted hover:border-tone-red-fg hover:text-tone-red-fg"><Trash2 className="size-4" /></button>
                              </ConfirmForm>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <footer className="border-t border-line px-5 py-3 text-xs text-ink-muted">Mostrando {filtered.length} de {appointments.length} citas (máx. 500 por consulta)</footer>
      </div>
    </section>
  );
}