import { useMemo, useState } from "react";
import { Search, PawPrint, SlidersHorizontal, UserRound, CalendarDays, Weight, ClipboardList } from "lucide-react";
import { Form, Link, useActionData } from "react-router";
import { NewPatientDialog } from "./NewPatientDialog";
import type { PatientOptions } from "../model/patient.types";

type PatientRow = {
  id: string; name: string; species: string; breed: string | null; sex: string | null;
  birthDate: string | null; weightKg: number | null; microchip: string | null;
  isActive: boolean; createdAt: string; ownerId?: string; ownerName?: string; ownerPhone?: string; ownerEmail?: string; ownerDocument?: string; ownerAddress?: string;
};

const speciesLabel = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value + "T00:00:00Z")) : "No registrada";

export function PacientesView({ patients, options, userRole }: { patients: PatientRow[]; options: PatientOptions; userRole: string }) {
  const actionData = useActionData() as { ok?: boolean; message?: string } | undefined;
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState("todos");
  const [status, setStatus] = useState("activos");
  const isVeterinarian = userRole === "veterinario";
  const canCreate = userRole === "admin" || userRole === "recepcion";
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("es");
    return patients.filter((p) => {
      const matchesQuery = !q || [p.name, p.ownerName, p.ownerPhone, p.microchip, p.breed].some((v) => v?.toLocaleLowerCase("es").includes(q));
      const matchesSpecies = species === "todos" || p.species === species;
      const matchesStatus = status === "todos" || (status === "activos" ? p.isActive : !p.isActive);
      return matchesQuery && matchesSpecies && matchesStatus;
    });
  }, [patients, query, species, status]);

  return (
    <section className="mx-auto flex max-w-[1500px] flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-text">{isVeterinarian ? "ATENCIÓN CLÍNICA" : "GESTIÓN ASISTENCIAL"}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Pacientes</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">{isVeterinarian ? "Consulta las fichas de tus pacientes y accede a su información clínica." : "Administra las fichas de los pacientes y encuentra rápidamente sus datos y propietarios."}</p>
        </div>
        {canCreate && <NewPatientDialog options={options} />}
      </header>

      {actionData?.message && <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${actionData.ok ? "border-tone-green-soft bg-tone-green-soft text-tone-green-fg" : "border-tone-amber-soft bg-tone-amber-soft text-tone-amber-fg"}`}>{actionData.message}</p>}

      {isVeterinarian && <div className="flex items-start gap-3 rounded-2xl border border-brand/15 bg-brand-soft/60 p-4 text-sm"><ClipboardList className="mt-0.5 size-5 shrink-0 text-brand-text" /><p>Modo de solo lectura para los datos generales. Para registrar hallazgos y tratamientos, utiliza Consultas.</p></div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="ui-card rounded-2xl border border-line bg-surface p-5 shadow-card"><p className="text-sm text-ink-muted">Pacientes registrados</p><p className="mt-2 text-3xl font-extrabold">{patients.length}</p><p className="mt-1 text-xs text-ink-muted">Registros accesibles según tus permisos</p></article>
        <article className="ui-card rounded-2xl border border-line bg-surface p-5 shadow-card"><p className="text-sm text-ink-muted">Pacientes activos</p><p className="mt-2 text-3xl font-extrabold">{patients.filter(p => p.isActive).length}</p><p className="mt-1 text-xs text-ink-muted">Disponibles para la atención</p></article>
        <article className="ui-card rounded-2xl border border-line bg-surface p-5 shadow-card"><p className="text-sm text-ink-muted">Resultados filtrados</p><p className="mt-2 text-3xl font-extrabold">{filtered.length}</p><p className="mt-1 text-xs text-ink-muted">Coincidencias de tu búsqueda</p></article>
      </div>

      <div className="rounded-2xl border border-line bg-surface shadow-card">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
            <span className="sr-only">Buscar paciente, propietario, teléfono o microchip</span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por paciente, propietario, teléfono o microchip..." className="ui-field h-11 w-full rounded-xl border border-line bg-bg pl-10 pr-3 text-sm outline-none" />
          </label>
          <label className="flex h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm">
            <SlidersHorizontal aria-hidden className="size-4 text-ink-muted" />
            <span className="sr-only">Filtrar por especie</span>
            <select value={species} onChange={e => setSpecies(e.target.value)} className="max-w-40 bg-transparent outline-none">
              <option value="todos">Todas las especies</option>
              {options.species.map(item => <option key={item} value={item}>{speciesLabel(item)}</option>)}
            </select>
          </label>
          <label className="flex h-11 items-center rounded-xl border border-line px-3 text-sm">
            <span className="sr-only">Filtrar por estado</span>
            <select value={status} onChange={e => setStatus(e.target.value)} className="bg-transparent outline-none">
              <option value="activos">Solo activos</option>
              <option value="inactivos">Solo inactivos</option>
              <option value="todos">Todos los estados</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-text"><PawPrint className="size-7" /></span>
            <h2 className="mt-4 text-lg font-bold">{patients.length === 0 ? "Todavía no hay pacientes" : "No encontramos coincidencias"}</h2>
            <p className="mt-1 max-w-md text-sm text-ink-muted">{patients.length === 0 ? (canCreate ? "Registra el primer paciente para comenzar a construir el padrón de la veterinaria." : "Aún no hay pacientes registrados para consultar.") : "Prueba con otro nombre, teléfono, microchip o filtro."}</p>
            {query && <button onClick={() => { setQuery(""); setSpecies("todos"); setStatus("activos"); }} className="ui-button mt-4 rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:bg-surface-muted">Limpiar filtros</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink-muted"><tr><th className="px-5 py-4 font-semibold">Paciente</th><th className="px-5 py-4 font-semibold">Propietario</th><th className="px-5 py-4 font-semibold">Ficha</th><th className="px-5 py-4 font-semibold">Registro</th><th className="px-5 py-4 font-semibold">Estado</th>{canCreate && <th className="px-5 py-4 font-semibold">Acciones</th>}{isVeterinarian && <th className="px-5 py-4 font-semibold">Acceso clínico</th>}</tr></thead>
              <tbody className="divide-y divide-line">
                {filtered.map(p => <tr key={p.id} className="transition-colors hover:bg-surface-muted/70">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text"><PawPrint className="size-5" /></span><div><p className="font-bold">{p.name}</p><p className="mt-0.5 text-xs text-ink-muted">{speciesLabel(p.species)}{p.breed ? " · " + p.breed : ""}</p></div></div></td>
                  <td className="px-5 py-4"><div className="flex items-start gap-2"><UserRound className="mt-0.5 size-4 text-ink-muted" /><div><p className="font-medium">{p.ownerName || "Propietario no disponible"}</p><p className="mt-0.5 text-xs text-ink-muted">{p.ownerPhone || "Sin teléfono"}</p></div></div></td>
                  <td className="px-5 py-4"><div className="flex flex-col gap-1 text-xs text-ink-muted"><span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" />{dateLabel(p.birthDate)}</span><span className="inline-flex items-center gap-1"><Weight className="size-3.5" />{p.weightKg ? p.weightKg + " kg" : "Peso pendiente"}</span>{p.microchip && <span>Microchip: {p.microchip}</span>}</div></td>
                  <td className="px-5 py-4 text-ink-muted">{dateLabel(p.createdAt.slice(0,10))}</td>
                  <td className="px-5 py-4"><span className={p.isActive ? "rounded-full bg-tone-green-soft px-2.5 py-1 text-xs font-semibold text-tone-green-fg" : "rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-muted"}>{p.isActive ? "Activo" : "Inactivo"}</span></td>
                  {canCreate && <td className="px-5 py-4 align-top">
                    <details className="min-w-40">
                      <summary className="cursor-pointer rounded-lg border border-line px-3 py-2 text-center text-xs font-semibold hover:border-brand hover:text-brand-text">Editar ficha</summary>
                      <div className="mt-2 min-w-[280px] max-w-xl rounded-xl border border-line bg-surface p-4">
                        <Form method="post" className="grid gap-3 sm:grid-cols-2">
                          <input type="hidden" name="intent" value="update" /><input type="hidden" name="patient_id" value={p.id} />
                          <p className="font-bold sm:col-span-2">Datos del paciente</p>
                          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">Nombre *<input name="name" required maxLength={80} defaultValue={p.name} className="ui-field h-10 rounded-lg border border-line bg-bg px-3 text-sm font-normal text-ink" /></label>
                          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">Especie *<select name="species" required defaultValue={p.species} className="ui-field h-10 rounded-lg border border-line bg-bg px-3 text-sm font-normal text-ink">{options.species.map(s => <option key={s} value={s}>{speciesLabel(s)}</option>)}</select></label>
                          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">Raza<input name="breed" maxLength={80} defaultValue={p.breed ?? ""} className="ui-field h-10 rounded-lg border border-line bg-bg px-3 text-sm font-normal text-ink" /></label>
                          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">Sexo<select name="sex" defaultValue={p.sex ?? ""} className="ui-field h-10 rounded-lg border border-line bg-bg px-3 text-sm font-normal text-ink"><option value="">Sin especificar</option>{options.sex.map(s => <option key={s} value={s}>{speciesLabel(s)}</option>)}</select></label>
                          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">Nacimiento<input name="birth_date" type="date" max={new Date().toISOString().slice(0,10)} defaultValue={p.birthDate ?? ""} className="ui-field h-10 rounded-lg border border-line bg-bg px-3 text-sm font-normal text-ink" /></label>
                          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">Peso (kg)<input name="weight_kg" type="number" min="0.01" max="5000" step="0.01" defaultValue={p.weightKg ?? ""} className="ui-field h-10 rounded-lg border border-line bg-bg px-3 text-sm font-normal text-ink" /></label>
                          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted sm:col-span-2">Microchip<input name="microchip" maxLength={30} defaultValue={p.microchip ?? ""} className="ui-field h-10 rounded-lg border border-line bg-bg px-3 text-sm font-normal text-ink" /></label>
                          <p className="font-bold sm:col-span-2">Datos del propietario</p>
                          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted sm:col-span-2">Nombre completo *<input name="owner_name" required minLength={2} maxLength={120} defaultValue={p.ownerName ?? ""} className="ui-field h-10 rounded-lg border border-line bg-bg px-3 text-sm font-normal text-ink" /></label>
                          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">Teléfono<input name="owner_phone" maxLength={30} defaultValue={p.ownerPhone ?? ""} className="ui-field h-10 rounded-lg border border-line bg-bg px-3 text-sm font-normal text-ink" /></label>
                          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">DNI/documento<input name="owner_document" maxLength={20} defaultValue={p.ownerDocument ?? ""} className="ui-field h-10 rounded-lg border border-line bg-bg px-3 text-sm font-normal text-ink" /></label>
                          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted sm:col-span-2">Correo<input name="owner_email" type="email" maxLength={160} defaultValue={p.ownerEmail ?? ""} className="ui-field h-10 rounded-lg border border-line bg-bg px-3 text-sm font-normal text-ink" /></label>
                          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted sm:col-span-2">Dirección<input name="owner_address" maxLength={200} defaultValue={p.ownerAddress ?? ""} className="ui-field h-10 rounded-lg border border-line bg-bg px-3 text-sm font-normal text-ink" /></label>
                          <button type="submit" className="ui-button h-10 rounded-lg bg-brand px-4 text-sm font-bold text-on-brand sm:col-span-2">Guardar cambios</button>
                        </Form>
                        <Form method="post" className="mt-3" onSubmit={event => { if (!window.confirm(p.isActive ? "¿Desactivar este paciente? Se conservará su historial clínico." : "¿Reactivar este paciente?")) event.preventDefault(); }}>
                          <input type="hidden" name="intent" value="toggle-active" /><input type="hidden" name="patient_id" value={p.id} /><input type="hidden" name="is_active" value={String(p.isActive)} />
                          <button type="submit" className={p.isActive ? "w-full rounded-lg border border-tone-red-soft px-3 py-2 text-xs font-semibold text-tone-red-fg hover:bg-tone-red-soft" : "w-full rounded-lg border border-line px-3 py-2 text-xs font-semibold hover:border-brand"}>{p.isActive ? "Desactivar paciente" : "Reactivar paciente"}</button>
                        </Form>
                      </div>
                    </details>
                  </td>}
                  {isVeterinarian && <td className="px-5 py-4"><Link to={`/historial-clinico?patient_id=${encodeURIComponent(p.id)}`} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-semibold transition hover:border-brand hover:text-brand-text"><ClipboardList className="size-4" /> Ver historial</Link></td>}
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
        <footer className="flex flex-col gap-2 border-t border-line px-5 py-3 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between"><span>Mostrando {filtered.length} de {patients.length} registros cargados</span><span>La lista está limitada a los 500 registros más recientes.</span></footer>
      </div>
    </section>
  );
}
