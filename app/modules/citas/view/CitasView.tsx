import { useMemo, useState } from "react";
import { CalendarDays, Search, SlidersHorizontal, Clock3, UserRound, PawPrint } from "lucide-react";
import { Form, useActionData, useSearchParams } from "react-router";

type Appointment = {
  id: string; startsAt: string; status: string; notes: string | null; patientId?: string;
  patientName?: string; species: string; ownerName?: string; careType?: string; vetName?: string;
};
type Props = {
  appointments: Appointment[];
  filters: { from: string; to: string; status: string };
  careTypes: { id: number; label: string }[];
  vets: { id: string; full_name: string }[];
  userRole: string;
  patients: { id: string; name: string }[];
};
const statusLabel = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const dateTime = (value: string) => new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const dayValue = (value: string) => value ? new Date(value).toISOString().slice(0, 10) : "";

export function CitasView({ appointments, filters, careTypes, vets, patients }: Props) {
  const actionData = useActionData() as { ok?: boolean; message?: string } | undefined;
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(filters.status || "todos");
  const [from, setFrom] = useState(filters.from);
  const [to, setTo] = useState(filters.to);
  const availableStatuses = useMemo(() => [...new Set(appointments.map(a => a.status).filter(Boolean))].sort(), [appointments]);
  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("es");
    return appointments.filter(a => !q || [a.patientName, a.ownerName, a.vetName, a.careType, a.notes].some(v => v?.toLocaleLowerCase("es").includes(q)));
  }, [appointments, search]);
  const applyFilters = () => {
    const next = new URLSearchParams(searchParams);
    from ? next.set("desde", from) : next.delete("desde");
    to ? next.set("hasta", to) : next.delete("hasta");
    status !== "todos" ? next.set("estado", status) : next.delete("estado");
    setSearchParams(next);
  };
  const reset = () => { setFrom(""); setTo(""); setStatus("todos"); setSearch(""); setSearchParams({}); };

  return <section className="mx-auto flex max-w-[1500px] flex-col gap-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-sm font-semibold text-brand-text">GESTIÓN ASISTENCIAL</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">Citas y agenda</h1><p className="mt-2 max-w-2xl text-sm text-ink-muted">Consulta las atenciones programadas y filtra la agenda por fechas, estado o paciente.</p></div>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-semibold"><CalendarDays className="size-5 text-brand-text" />{appointments.length} citas en resultados</div>
    </header>

    {actionData?.message ? <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${actionData.ok ? "border-tone-green-soft bg-tone-green-soft text-tone-green-fg" : "border-tone-amber-soft bg-tone-amber-soft text-tone-amber-fg"}`}>{actionData.message}</p> : null}
    <details className="rounded-2xl border border-line bg-surface shadow-card">
      <summary className="cursor-pointer list-none px-5 py-4 font-bold">Programar nueva cita <span className="ml-2 text-xs font-normal text-ink-muted">Abrir formulario</span></summary>
      <Form method="post" className="grid gap-4 border-t border-line p-5 sm:grid-cols-2 xl:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted">Paciente *
          <select name="patient_id" required className="h-11 rounded-xl border border-line bg-bg px-3 text-sm font-normal text-ink">
            <option value="">Selecciona un paciente</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted">Tipo de atención *
          <select name="care_type_id" required className="h-11 rounded-xl border border-line bg-bg px-3 text-sm font-normal text-ink">
            <option value="">Selecciona la atención</option>
            {careTypes.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted">Fecha y hora *
          <input name="starts_at" type="datetime-local" required min={new Date().toISOString().slice(0, 16)} className="h-11 rounded-xl border border-line bg-bg px-3 text-sm font-normal text-ink" />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted">Veterinario
          <select name="vet_id" className="h-11 rounded-xl border border-line bg-bg px-3 text-sm font-normal text-ink">
            <option value="">Sin asignar</option>
            {vets.map(v => <option key={v.id} value={v.id}>{v.full_name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted sm:col-span-2">Notas
          <textarea name="notes" rows={2} maxLength={2000} className="rounded-xl border border-line bg-bg p-3 text-sm font-normal text-ink" />
        </label>
        <div className="flex items-end"><button type="submit" className="h-11 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand hover:opacity-90">Guardar cita</button></div>
      </Form>
    </details>

    <div className="grid gap-4 sm:grid-cols-3">
      <article className="rounded-2xl border border-line bg-surface p-5 shadow-card"><p className="text-sm text-ink-muted">Citas cargadas</p><p className="mt-2 text-3xl font-extrabold">{appointments.length}</p><p className="mt-1 text-xs text-ink-muted">Según permisos de tu usuario</p></article>
      <article className="rounded-2xl border border-line bg-surface p-5 shadow-card"><p className="text-sm text-ink-muted">Pendientes</p><p className="mt-2 text-3xl font-extrabold">{appointments.filter(a => a.status === "pendiente").length}</p><p className="mt-1 text-xs text-ink-muted">Requieren seguimiento</p></article>
      <article className="rounded-2xl border border-line bg-surface p-5 shadow-card"><p className="text-sm text-ink-muted">Otros estados</p><p className="mt-2 text-3xl font-extrabold">{appointments.filter(a => a.status !== "pendiente").length}</p><p className="mt-1 text-xs text-ink-muted">Estados distintos de pendiente</p></article>
    </div>

    <div className="rounded-2xl border border-line bg-surface shadow-card">
      <div className="grid gap-3 border-b border-line p-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.3fr_auto_auto] xl:items-end">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted">Desde<input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-11 rounded-xl border border-line bg-bg px-3 text-sm font-normal text-ink" /></label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted">Hasta<input type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} className="h-11 rounded-xl border border-line bg-bg px-3 text-sm font-normal text-ink" /></label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted">
          Estado
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="h-11 rounded-xl border border-line bg-bg px-3 text-sm font-normal text-ink"
          >
            <option value="todos">Todos los estados</option>
            {availableStatuses.map(value => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="relative flex flex-col gap-1.5 text-xs font-semibold text-ink-muted">Buscar cita<span className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Paciente, dueño o veterinario" className="h-11 w-full rounded-xl border border-line bg-bg pl-9 pr-3 text-sm font-normal text-ink" /></span></label>
        <button onClick={applyFilters} className="h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-on-brand hover:opacity-90"><SlidersHorizontal className="mr-2 inline size-4" />Aplicar</button>
        <button onClick={reset} className="h-11 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-surface-muted">Limpiar</button>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-text">
            <CalendarDays className="size-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold">No hay citas para mostrar</h2>
          <p className="mt-1 max-w-md text-sm text-ink-muted">
            Prueba cambiando el rango de fechas o los filtros de búsqueda.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-5 py-4">Fecha y hora</th>
                <th className="px-5 py-4">Paciente</th>
                <th className="px-5 py-4">Atención</th>
                <th className="px-5 py-4">Veterinario</th>
                <th className="px-5 py-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((appointment) => (
                <tr key={appointment.id} className="transition-colors hover:bg-surface-muted/70">
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-2 font-semibold">
                      <Clock3 className="size-4 text-ink-muted" />
                      {dateTime(appointment.startsAt)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
                        <PawPrint className="size-5" />
                      </span>
                      <div>
                        <p className="font-bold">{appointment.patientName || "Paciente no disponible"}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {appointment.ownerName || "Propietario no disponible"} · {appointment.species}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium">{appointment.careType || "Atención general"}</p>
                    {appointment.notes ? (
                      <p className="mt-1 max-w-xs truncate text-xs text-ink-muted">{appointment.notes}</p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2">
                      <UserRound className="size-4 text-ink-muted" />
                      {appointment.vetName || "Sin asignar"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        appointment.status === "pendiente"
                          ? "rounded-full bg-tone-amber-soft px-2.5 py-1 text-xs font-semibold text-tone-amber-fg"
                          : "rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-muted"
                      }
                    >
                      {statusLabel(appointment.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <footer className="flex flex-col gap-2 border-t border-line px-5 py-3 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between"><span>Mostrando {filtered.length} registros de los resultados cargados</span><span>Máximo 500 citas por consulta.</span></footer>
    </div>
  </section>;
}
