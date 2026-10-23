import { useMemo, useState } from "react";
import { Form, useActionData } from "react-router";
import { Activity, ClipboardList, FileBarChart, Package, Settings2, Syringe } from "lucide-react";

type Row = Record<string, unknown>;
type Metric = { label: string; value: number | null; unavailable: boolean };
type Option = { id: string; name: string };
type AppointmentOption = { id: string; starts_at: string; patient?: { name?: string } | null };
type ActionResult = { ok?: boolean; message?: string };
type Props = {
  moduleKey: string; title: string; rows: Row[]; metrics: Metric[]; columns: string[];
  readOnly: boolean; message?: string | null; patients: Option[];
  appointments: AppointmentOption[]; vaccines: Option[];
};

const ICONS: Record<string, typeof Activity> = {
  consultas: ClipboardList, historial: Activity, vacunas: Syringe,
  productos: Package, reportes: FileBarChart, configuracion: Settings2,
};
const LABELS: Record<string, string> = {
  consultations: "Consultas", patients: "Pacientes", appointments: "Citas",
  vaccinations: "Vacunaciones", products: "Productos", diagnosis: "Diagnóstico",
  treatment: "Tratamiento", symptoms: "Síntomas", created_at: "Fecha de registro",
  weight_kg: "Peso (kg)", temperature_c: "Temperatura (°C)", name: "Nombre",
  species: "Especie", breed: "Raza", stock: "Existencias", min_stock: "Stock mínimo",
  price: "Precio", full_name: "Nombre completo", phone: "Teléfono", email: "Correo",
  role: "Rol", is_active: "Activo", notes: "Notas", status: "Estado",
  patient_id: "Paciente", vaccine_id: "Vacuna", applied_at: "Fecha de aplicación",
  next_due_at: "Próxima dosis", vet_id: "Veterinario", appointment_id: "Cita",
  description: "Descripción", sku: "SKU", starts_at: "Fecha de cita",
};
function pretty(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "object") {
    if (Array.isArray(value)) return value.map(pretty).join(", ");
    return Object.values(value as Record<string, unknown>).map(pretty).join(" · ");
  }
  return String(value);
}
function label(value: string) {
  return LABELS[value] ?? value.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
}
function Field({ name, title, type = "text", required = false, step, min, max, defaultValue }: {
  name: string; title: string; type?: string; required?: boolean; step?: string; min?: string; max?: string; defaultValue?: string;
}) {
  return <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted">
    {title}
    <input name={name} type={type} required={required} step={step} min={min} max={max} defaultValue={defaultValue}
      className="h-11 rounded-xl border border-line bg-bg px-3 text-sm font-normal text-ink" />
  </label>;
}
function SelectField({ name, title, options, required = false, placeholder = "Selecciona..." }: {
  name: string; title: string; options: { id: string; name: string }[]; required?: boolean; placeholder?: string;
}) {
  return <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted">
    {title}
    <select name={name} required={required} className="h-11 rounded-xl border border-line bg-bg px-3 text-sm font-normal text-ink">
      <option value="">{placeholder}</option>
      {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
  </label>;
}

export function AdminModuleView({ moduleKey, title, rows, metrics, columns, readOnly, patients, appointments, vaccines }: Props) {
  const Icon = ICONS[moduleKey] ?? Activity;
  const actionData = useActionData() as ActionResult | undefined;
  const [search, setSearch] = useState("");
  const filteredRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    if (!query) return rows;
    return rows.filter((row) => Object.values(row).some((value) => pretty(value).toLocaleLowerCase("es").includes(query)));
  }, [rows, search]);
  const exportCsv = () => {
    const csvRows = [columns, ...filteredRows.map((row) => columns.map((column) => pretty(row[column])))];
    const csv = csvRows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\\r\\n");
    const blob = new Blob(["\\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `alfapet-${moduleKey}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const canCreate = ["consultas", "vacunas", "productos"].includes(moduleKey);
  return <section className="mx-auto flex max-w-[1500px] flex-col gap-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-text">Administración · AlfaPet</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">Información consultada desde Supabase y sujeta a los permisos de tu sesión.</p>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-text"><Icon className="size-5" /></span>
        <div><p className="text-xs text-ink-muted">Datos de la clínica</p><p className="font-semibold">Conexión Supabase</p></div>
      </div>
    </header>

    {actionData?.message ? <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${actionData.ok ? "border-tone-green-soft bg-tone-green-soft text-tone-green-fg" : "border-tone-amber-soft bg-tone-amber-soft text-tone-amber-fg"}`}>{actionData.message}</p> : null}

    {moduleKey === "configuracion" ? <Form method="post" className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <input type="hidden" name="intent" value="update-profile" />
      <h2 className="font-bold">Datos del perfil</h2>
      <p className="mt-1 text-sm text-ink-muted">Puedes actualizar tu nombre visible. El rol y los permisos se administran de forma separada.</p>
      <div className="mt-4 flex flex-col gap-3 sm:max-w-xl sm:flex-row sm:items-end">
        <Field name="full_name" title="Nombre completo" required defaultValue={String(rows[0]?.full_name ?? "")} />
        <button type="submit" className="h-11 shrink-0 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand hover:opacity-90">Guardar perfil</button>
      </div>
    </Form> : null}

    {canCreate ? <details className="rounded-2xl border border-line bg-surface shadow-card" open={false}>
      <summary className="cursor-pointer list-none px-5 py-4 font-bold">{moduleKey === "consultas" ? "Registrar consulta clínica" : moduleKey === "vacunas" ? "Registrar vacunación" : "Registrar producto"} <span className="ml-2 text-xs font-normal text-ink-muted">Abrir formulario</span></summary>
      <Form method="post" className="grid gap-4 border-t border-line p-5 sm:grid-cols-2 xl:grid-cols-3">
        <input type="hidden" name="intent" value="create" />
        {moduleKey === "consultas" ? <>
          <SelectField name="patient_id" title="Paciente" options={patients} required />
          <SelectField name="appointment_id" title="Cita relacionada" options={appointments.map(a => ({ id: a.id, name: `${new Date(a.starts_at).toLocaleString("es-PE")} · ${a.patient?.name ?? "Paciente"}` }))} placeholder="Sin cita relacionada" />
          <Field name="weight_kg" title="Peso (kg)" type="number" step="0.01" min="0.01" max="5000" />
          <Field name="temperature_c" title="Temperatura (°C)" type="number" step="0.1" min="30" max="45" />
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted sm:col-span-2">Síntomas<textarea name="symptoms" rows={2} maxLength={4000} className="rounded-xl border border-line bg-bg p-3 text-sm font-normal text-ink" /></label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted sm:col-span-2">Diagnóstico *<textarea name="diagnosis" required rows={2} maxLength={4000} className="rounded-xl border border-line bg-bg p-3 text-sm font-normal text-ink" /></label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted sm:col-span-2">Tratamiento<textarea name="treatment" rows={2} maxLength={4000} className="rounded-xl border border-line bg-bg p-3 text-sm font-normal text-ink" /></label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted sm:col-span-2">Notas<textarea name="notes" rows={2} maxLength={4000} className="rounded-xl border border-line bg-bg p-3 text-sm font-normal text-ink" /></label>
        </> : moduleKey === "vacunas" ? <>
          <SelectField name="patient_id" title="Paciente" options={patients} required />
          <SelectField name="vaccine_id" title="Vacuna" options={vaccines} required />
          <Field name="applied_at" title="Fecha de aplicación" type="date" required />
          <Field name="next_due_at" title="Próxima dosis" type="date" />
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted sm:col-span-2">Notas<textarea name="notes" rows={2} maxLength={4000} className="rounded-xl border border-line bg-bg p-3 text-sm font-normal text-ink" /></label>
        </> : <>
          <Field name="name" title="Nombre del producto" required />
          <Field name="sku" title="Código SKU" />
          <Field name="stock" title="Existencias iniciales" type="number" step="1" min="0" required />
          <Field name="min_stock" title="Stock mínimo" type="number" step="1" min="0" />
          <Field name="price" title="Precio unitario" type="number" step="0.01" min="0" required />
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted sm:col-span-2">Descripción<textarea name="description" rows={2} maxLength={4000} className="rounded-xl border border-line bg-bg p-3 text-sm font-normal text-ink" /></label>
        </>}
        <div className="flex items-end"><button type="submit" className="h-11 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand hover:opacity-90">Guardar registro</button></div>
      </Form>
    </details> : null}

    {metrics.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric) => <article key={metric.label} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <p className="text-sm text-ink-muted">{label(metric.label)}</p>
        <p className="mt-2 text-3xl font-extrabold">{metric.unavailable ? "—" : metric.value ?? 0}</p>
        <p className="mt-1 text-xs text-ink-muted">{metric.unavailable ? "No disponible por permisos o configuración" : "Registros en Supabase"}</p>
      </article>)}
    </div> : null}

    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex flex-col gap-1 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-bold">{moduleKey === "configuracion" ? "Perfil de la sesión" : moduleKey === "historial" ? "Registros clínicos" : "Registros"}</h2>
        <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-ink-muted">{filteredRows.length} registros mostrados{rows.length === 300 ? " · límite de 300" : ""}</span>{rows.length > 0 ? <button type="button" onClick={exportCsv} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold hover:bg-surface-muted">Exportar CSV</button> : null}</div>
      </div>
      {rows.length > 0 ? <div className="border-b border-line p-4"><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar en los registros..." className="h-10 w-full max-w-md rounded-xl border border-line bg-bg px-3 text-sm" aria-label="Buscar en los registros" /></div> : null}
      {filteredRows.length === 0 ? <div className="flex flex-col items-center px-6 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-text"><Icon className="size-6" /></span>
        <h3 className="mt-4 font-bold">No hay registros para mostrar</h3>
        <p className="mt-1 max-w-md text-sm text-ink-muted">No se encontraron datos visibles. Comprueba las políticas RLS y que existan registros en Supabase.</p>
      </div> : <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink-muted"><tr>{columns.map((column) => <th key={column} className="px-5 py-4">{label(column)}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">{filteredRows.map((row, index) => <tr key={String(row.id ?? index)} className="hover:bg-surface-muted/60">
            {columns.map((column) => <td key={column} className="max-w-sm px-5 py-4 align-top"><span className={column === "diagnosis" || column === "name" || column === "full_name" ? "font-semibold" : ""}>{pretty(row[column])}</span></td>)}
          </tr>)}</tbody>
        </table>
      </div>}
      <div className="border-t border-line bg-surface-muted/40 px-5 py-3 text-xs text-ink-muted">
        {readOnly ? "Historial en modo consulta: no modifica ni elimina datos clínicos." : "Los cambios se validan en servidor y también dependen de las políticas RLS de Supabase."}
      </div>
    </div>
  </section>;
}
