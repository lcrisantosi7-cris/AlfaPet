import { useMemo, useState } from "react";
import { Form, useActionData } from "react-router";
import { Activity, ClipboardList, FileBarChart, Package, Settings2, Syringe } from "lucide-react";
import { PageHeader } from "~/core/ui/PageHeader";
import { AdminField as Field, AdminSelectField as SelectField } from "./AdminFormFields";

type Row = Record<string, unknown>;
type Metric = { label: string; value: number | null; unavailable: boolean };
type ReportFilters = { from: string; to: string };
type Option = { id: string | number; name: string };
type AppointmentOption = { id: string; starts_at: string; patient?: { name?: string } | null };
type ActionResult = { ok?: boolean; message?: string };
type Props = {
  moduleKey: string; title: string; rows: Row[]; metrics: Metric[]; columns: string[];
  readOnly: boolean; message?: string | null; patients: Option[];
  appointments: AppointmentOption[]; vaccines: Option[]; reportFilters?: ReportFilters; categories?: Option[]; veterinarians?: { id: string; full_name: string; job_title: string | null }[];
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
  due_date: "Próxima dosis", administered_by: "Administrado por", appointment_id: "Cita",
  category: "Categoría", sku: "SKU", starts_at: "Fecha de cita", job_title: "Cargo",
  avatar_url: "URL de avatar", record_type: "Tipo de registro",
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

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  completada: "Atendida",
  cancelada: "Cancelada",
  activo: "Activo",
  inactivo: "Inactivo",
  admin: "Administrador",
  veterinario: "Veterinario",
  recepcion: "Recepción",
};

function displayValue(column: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Activo" : "Inactivo";
  if (["created_at", "updated_at", "starts_at", "applied_at", "due_date", "birth_date"].includes(column)) {
    const rawDate = String(value);
    const hasTime = rawDate.includes("T") && !["applied_at", "due_date", "birth_date"].includes(column);
    const date = hasTime
      ? new Date(rawDate)
      : new Date(rawDate.slice(0, 10) + "T12:00:00");
    if (Number.isNaN(date.getTime())) return rawDate;
    return new Intl.DateTimeFormat("es-PE", hasTime
      ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "short", year: "numeric" }).format(date);
  }
  if (column === "price") {
    const amount = Number(value);
    return Number.isFinite(amount) ? new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(amount) : String(value);
  }
  if (column === "status" || column === "role") return STATUS_LABELS[String(value)] ?? String(value);
  return pretty(value);
}

function statusTone(value: unknown): string {
  switch (String(value ?? "").toLowerCase()) {
    case "completada":
    case "activo":
      return "bg-tone-green-soft text-tone-green-fg";
    case "confirmada":
    case "pendiente":
      return "bg-tone-blue-soft text-tone-blue-fg";
    case "cancelada":
    case "inactivo":
      return "bg-tone-red-soft text-tone-red-fg";
    default:
      return "bg-surface-muted text-ink-muted";
  }
}
export function AdminModuleView({ moduleKey, title, rows, metrics, columns, readOnly, patients, appointments, vaccines, reportFilters, categories = [], veterinarians = [] }: Props) {
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
    const csv = csvRows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `alfapet-${moduleKey}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const canCreate = ["consultas", "vacunas", "productos"].includes(moduleKey);
  return <section className="mx-auto flex max-w-[1500px] flex-col gap-6">
    <PageHeader
      eyebrow={moduleKey === "reportes" ? "Análisis y seguimiento" : moduleKey === "configuracion" ? "Cuenta y preferencias" : "Administración · AlfaPet"}
      title={title}
      description={{
        consultas: "Registros de atención para dar continuidad al cuidado de cada paciente.",
        historial: "Consulta cronológica de las atenciones y vacunaciones registradas.",
        vacunas: "Control de aplicaciones y próximas dosis para mantener al día cada esquema.",
        productos: "Supervisa existencias, precios y alertas para reponer a tiempo.",
        reportes: "Indicadores de actividad clínica e inventario para tomar decisiones.",
        configuracion: "Mantén tus datos de acceso actualizados y seguros.",
      }[moduleKey] ?? "Información de la clínica organizada para una gestión más clara."}
      action={
        <div className="hidden items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 sm:flex">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
            <Icon className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs text-ink-muted">Área de trabajo</p>
            <p className="font-semibold">{moduleKey === "reportes" ? "Vista analítica" : "Datos actualizados"}</p>
          </div>
        </div>
      }
    />

    {actionData?.message ? <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${actionData.ok ? "border-tone-green-soft bg-tone-green-soft text-tone-green-fg" : "border-tone-amber-soft bg-tone-amber-soft text-tone-amber-fg"}`}>{actionData.message}</p> : null}

    {moduleKey === "configuracion" ? <Form method="post" className="ui-card rounded-2xl border border-line bg-surface p-5 shadow-card">
      <input type="hidden" name="intent" value="update-profile" />
      <h2 className="font-bold">Mi perfil</h2>
      <p className="mt-1 text-sm text-ink-muted">Puedes cambiar tu nombre y, si lo necesitas, establecer una contraseña nueva. El rol y los permisos solo los administra el administrador.</p>
      <div className="mt-4 grid gap-3 sm:max-w-3xl sm:grid-cols-2">
        <Field name="full_name" title="Nombre completo" required defaultValue={String(rows[0]?.full_name ?? "")} />
        <Field name="password" title="Nueva contraseña (opcional, mínimo 12 caracteres)" type="password" min="12" />
        <div className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted"><span>Rol</span><div className="flex h-11 items-center rounded-xl border border-line bg-surface-muted px-3 text-sm font-normal text-ink">{pretty(rows[0]?.role)}</div></div>
        <div className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted"><span>Estado de la cuenta</span><div className="flex h-11 items-center rounded-xl border border-line bg-surface-muted px-3 text-sm font-normal text-ink">{rows[0]?.is_active ? "Activa" : "Inactiva"}</div></div>
      </div>
      <button type="submit" className="mt-4 h-11 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand transition hover:-translate-y-0.5 hover:shadow-lg">Guardar cambios</button>
    </Form> : null}

    {moduleKey === "configuracion" && rows[0]?.role === "recepcion" ? <section className="ui-card rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div><h2 className="font-bold">Perfiles de veterinarios</h2><p className="mt-1 text-sm text-ink-muted">Recepción puede corregir el nombre y establecer una nueva contraseña para un veterinario. Los perfiles de administración no aparecen aquí.</p></div>
      {veterinarians.length === 0 ? <p className="mt-4 rounded-xl bg-surface-muted p-4 text-sm text-ink-muted">No hay veterinarios activos registrados.</p> : <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {veterinarians.map(vet => <Form key={vet.id} method="post" className="ui-card grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-2">
          <input type="hidden" name="intent" value="update-veterinarian" />
          <input type="hidden" name="profile_id" value={vet.id} />
          <div className="sm:col-span-2"><p className="font-semibold">{vet.full_name}</p><p className="text-xs text-ink-muted">{vet.job_title || "Veterinario"}</p></div>
          <Field name="full_name" title="Nombre completo" required defaultValue={vet.full_name} />
          <Field name="password" title="Nueva contraseña (opcional)" type="password" min="12" />
          <p className="text-xs text-ink-muted sm:col-span-2">Deja la contraseña vacía si solo deseas cambiar el nombre. Si la cambias, utiliza al menos 12 caracteres y comunícasela al veterinario de forma segura.</p>
          <div className="sm:col-span-2"><button type="submit" className="h-10 rounded-xl border border-line px-4 text-sm font-semibold transition hover:border-brand hover:text-brand-text">Guardar perfil de veterinario</button></div>
        </Form>)}
      </div>}
    </section> : null}

    {canCreate ? <details className="ui-card rounded-2xl border border-line bg-surface shadow-card">
      <summary className="cursor-pointer list-none px-5 py-4 font-bold">{moduleKey === "consultas" ? "Registrar consulta clínica" : moduleKey === "vacunas" ? "Registrar vacunación" : "Registrar producto"} <span className="ml-2 text-xs font-normal text-ink-muted">Abrir formulario</span></summary>
      <Form method="post" className="grid gap-4 border-t border-line p-5 sm:grid-cols-2 xl:grid-cols-3">
        <input type="hidden" name="intent" value="create" />
        {moduleKey === "consultas" ? <>
          <SelectField name="patient_id" title="Paciente" options={patients} required />
          <SelectField name="appointment_id" title="Cita relacionada" options={appointments.map(a => ({ id: a.id, name: `${new Date(a.starts_at).toLocaleString("es-PE")} · ${a.patient?.name ?? "Paciente"}` }))} placeholder="Sin cita relacionada" />
          <Field name="weight_kg" title="Peso (kg)" type="number" step="0.01" min="0.01" max="5000" />
          <Field name="temperature_c" title="Temperatura (°C)" type="number" step="0.1" min="30" max="45" />
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted sm:col-span-2">Síntomas<textarea name="symptoms" rows={2} maxLength={2000} className="ui-field rounded-xl border border-line bg-bg p-3 text-sm font-normal text-ink" /></label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted sm:col-span-2">Diagnóstico *<textarea name="diagnosis" required rows={2} maxLength={2000} className="ui-field rounded-xl border border-line bg-bg p-3 text-sm font-normal text-ink" /></label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted sm:col-span-2">Tratamiento<textarea name="treatment" rows={2} maxLength={2000} className="ui-field rounded-xl border border-line bg-bg p-3 text-sm font-normal text-ink" /></label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted sm:col-span-2">Notas<textarea name="notes" rows={2} maxLength={2000} className="ui-field rounded-xl border border-line bg-bg p-3 text-sm font-normal text-ink" /></label>
        </> : moduleKey === "vacunas" ? <>
          <SelectField name="patient_id" title="Paciente" options={patients} required />
          <SelectField name="vaccine_id" title="Vacuna" options={vaccines} required />
          <Field name="applied_at" title="Fecha de aplicación" type="date" />
          <Field name="due_date" title="Próxima dosis (obligatoria)" type="date" required />
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted sm:col-span-2">Notas (máx. 500 caracteres)<textarea name="notes" rows={2} maxLength={500} className="ui-field rounded-xl border border-line bg-bg p-3 text-sm font-normal text-ink" /></label>
        </> : <>
          <Field name="name" title="Nombre del producto" required />
          <Field name="sku" title="Código SKU" required />
          <Field name="stock" title="Existencias iniciales" type="number" step="1" min="0" required />
          <Field name="min_stock" title="Stock mínimo" type="number" step="1" min="0" />
          <Field name="price" title="Precio unitario" type="number" step="0.01" min="0" required />
          <SelectField name="category_id" title="Categoría" options={categories} placeholder="Sin categoría" />
        </>}
        <div className="flex items-end"><button type="submit" className="h-11 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand hover:opacity-90">Guardar registro</button></div>
      </Form>
    </details> : null}

    {moduleKey === "productos" ? <div className="grid gap-4 sm:grid-cols-3">
      <article className="ui-card rounded-2xl border border-tone-red-soft bg-tone-red-soft/40 p-5"><p className="text-sm font-medium text-tone-red-fg">Agotados</p><p className="mt-2 text-3xl font-extrabold tabular-nums">{rows.filter(row => Number(row.stock ?? 0) <= 0).length}</p><p className="mt-1 text-xs text-tone-red-fg">Sin unidades disponibles</p></article>
      <article className="ui-card rounded-2xl border border-tone-amber-soft bg-tone-amber-soft/40 p-5"><p className="text-sm font-medium text-tone-amber-fg">Bajo el mínimo</p><p className="mt-2 text-3xl font-extrabold tabular-nums">{rows.filter(row => Number(row.stock ?? 0) > 0 && Number(row.stock ?? 0) <= Number(row.min_stock ?? 0)).length}</p><p className="mt-1 text-xs text-tone-amber-fg">Necesitan reposición</p></article>
      <article className="ui-card rounded-2xl border border-tone-green-soft bg-tone-green-soft/40 p-5"><p className="text-sm font-medium text-tone-green-fg">Stock suficiente</p><p className="mt-2 text-3xl font-extrabold tabular-nums">{rows.filter(row => Number(row.stock ?? 0) > Number(row.min_stock ?? 0)).length}</p><p className="mt-1 text-xs text-tone-green-fg">Por encima del mínimo configurado</p></article>
    </div> : null}

    {moduleKey === "reportes" ? <Form method="get" className="grid gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted">Desde<input name="desde" type="date" defaultValue={reportFilters?.from ?? ""} className="ui-field h-11 rounded-xl border border-line bg-bg px-3 text-sm font-normal text-ink" /></label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted">Hasta<input name="hasta" type="date" min={reportFilters?.from || undefined} defaultValue={reportFilters?.to ?? ""} className="ui-field h-11 rounded-xl border border-line bg-bg px-3 text-sm font-normal text-ink" /></label>
      <button type="submit" className="h-11 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand">Aplicar período</button>
      <a href="/reportes" className="flex h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold hover:bg-surface-muted">Limpiar</a>
      <p className="text-xs text-ink-muted sm:col-span-4">El período filtra citas, consultas clínicas y vacunaciones por sus fechas correspondientes. Los totales de pacientes, propietarios e inventario representan el estado actual.</p>
    </Form> : null}

    {moduleKey === "reportes" ? <section className="ui-card rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div><h2 className="font-bold">Distribución de citas</h2><p className="mt-1 text-sm text-ink-muted">Comparación de los estados registrados para el período seleccionado.</p></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {metrics.filter(metric => metric.label.startsWith("Citas ")).map(metric => {
          const maxValue = Math.max(1, ...metrics.filter(item => item.label.startsWith("Citas ")).map(item => item.value ?? 0));
          const width = Math.max(0, Math.min(100, ((metric.value ?? 0) / maxValue) * 100));
          return <div key={metric.label}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-medium">{metric.label.replace("Citas ", "")}</span><span className="font-bold tabular-nums">{metric.unavailable ? "—" : metric.value ?? 0}</span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted"><div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: metric.unavailable ? "0%" : width + "%" }} /></div>
          </div>;
        })}
      </div>
    </section> : null}

    {metrics.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => <article key={metric.label} className="ui-card rounded-2xl border border-line bg-surface p-5 shadow-card">
        <p className="text-sm text-ink-muted">{metric.label}</p>
        <p className="mt-2 text-3xl font-extrabold">{metric.unavailable ? "—" : metric.value ?? 0}</p>
        <p className="mt-1 text-xs text-ink-muted">{metric.unavailable ? "No disponible por permisos o configuración" : moduleKey === "reportes" ? "Según el período y los permisos actuales" : "Registros en Supabase"}</p>
      </article>)}
    </div> : null}

    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex flex-col gap-4 border-b border-line px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-bold">{moduleKey === "configuracion" ? "Datos del perfil" : moduleKey === "historial" ? "Registros clínicos" : moduleKey === "reportes" ? "Resumen de la clínica" : moduleKey === "productos" ? "Inventario de productos" : "Registros"}</h2>
          <p className="mt-1 text-xs text-ink-muted">Consulta, filtra y revisa los datos de esta sección.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {rows.length > 0 ? <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-line bg-bg px-3 focus-within:border-brand sm:w-64">
            <Activity className="size-4 shrink-0 text-ink-muted" aria-hidden />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar registros…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted" aria-label="Buscar en los registros" />
          </label> : null}
          <span className="whitespace-nowrap text-xs text-ink-muted">{filteredRows.length} de {rows.length}</span>
          {rows.length > 0 ? <button type="button" onClick={exportCsv} className="ui-button inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line px-3 text-xs font-semibold hover:bg-surface-muted"><FileBarChart className="size-4" aria-hidden /> Exportar CSV</button> : null}
        </div>
      </div>
      {filteredRows.length === 0 ? <div className="flex flex-col items-center px-6 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-text"><Icon className="size-6" /></span>
        <h3 className="mt-4 font-bold">No hay registros para mostrar</h3>
        <p className="mt-1 max-w-md text-sm text-ink-muted">No se encontraron datos visibles. Si esperabas datos, comprueba las políticas RLS y que existan registros en Supabase.</p>
      </div> : <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-surface-muted text-xs uppercase tracking-wide text-ink-muted"><tr>{columns.map((column) => <th key={column} className="px-5 py-4">{label(column)}</th>)}{!readOnly && ["consultas", "vacunas", "productos"].includes(moduleKey) && <th className="px-5 py-4">Acciones</th>}</tr></thead>
          <tbody className="divide-y divide-line">{filteredRows.map((row, index) => <tr key={String(row.id ?? index)} className="transition-colors hover:bg-surface-muted/60">
            {columns.map((column) => <td key={column} className="max-w-sm px-5 py-4 align-top">
              {moduleKey === "productos" && column === "stock" ? (() => {
                const stock = Number(row.stock ?? 0);
                const minimum = Number(row.min_stock ?? 0);
                const tone = stock <= 0 ? "bg-tone-red-soft text-tone-red-fg" : stock <= minimum ? "bg-tone-amber-soft text-tone-amber-fg" : "bg-tone-green-soft text-tone-green-fg";
                const status = stock <= 0 ? "Agotado" : stock <= minimum ? "Bajo mínimo" : "Disponible";
                return <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold " + tone}><span className="size-1.5 rounded-full bg-current" />{pretty(stock)} · {status}</span>;
              })() : column === "status" || column === "role" || typeof row[column] === "boolean" ? <span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold " + statusTone(row[column])}>{displayValue(column, row[column])}</span> : <span className={column === "diagnosis" || column === "name" || column === "full_name" ? "font-semibold text-ink" : "text-ink-muted"}>{displayValue(column, row[column])}</span>}
            </td>)}{!readOnly && ["consultas", "vacunas", "productos"].includes(moduleKey) && <td className="px-5 py-4 align-top"><details className="min-w-36"><summary className="cursor-pointer rounded-lg border border-line px-3 py-2 text-center text-xs font-semibold hover:border-brand hover:text-brand-text">Editar / más</summary><div className="mt-3 min-w-64 rounded-xl border border-line bg-surface p-3"><Form method="post" className="grid gap-3"><input type="hidden" name="intent" value="update" /><input type="hidden" name="record_id" value={String(row.id ?? "")} /><p className="text-sm font-bold">Editar registro</p>{moduleKey === "productos" ? <><Field name="name" title="Nombre" required defaultValue={String(row.name ?? "")} /><Field name="sku" title="SKU" required defaultValue={String(row.sku ?? "")} /><SelectField name="category_id" title="Categoría" options={categories} placeholder="Sin categoría" defaultValue={String(row.category_id ?? "")} /><Field name="price" title="Precio (S/)" type="number" min="0" step="0.01" required defaultValue={String(row.price ?? "0")} /><Field name="stock" title="Existencias" type="number" min="0" step="1" required defaultValue={String(row.stock ?? "0")} /><Field name="min_stock" title="Stock mínimo" type="number" min="0" step="1" required defaultValue={String(row.min_stock ?? "0")} /></> : moduleKey === "consultas" ? <><label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">Síntomas<textarea name="symptoms" rows={2} maxLength={2000} defaultValue={String(row.symptoms ?? "")} className="ui-field rounded-lg border border-line bg-surface p-2 text-sm font-normal text-ink" /></label><label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">Diagnóstico<textarea name="diagnosis" rows={2} required maxLength={2000} defaultValue={String(row.diagnosis ?? "")} className="rounded-lg border border-line bg-bg p-2 text-sm font-normal text-ink" /></label><label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">Tratamiento<textarea name="treatment" rows={2} maxLength={2000} defaultValue={String(row.treatment ?? "")} className="rounded-lg border border-line bg-bg p-2 text-sm font-normal text-ink" /></label><label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">Notas<textarea name="notes" rows={2} maxLength={2000} defaultValue={String(row.notes ?? "")} className="rounded-lg border border-line bg-bg p-2 text-sm font-normal text-ink" /></label><Field name="weight_kg" title="Peso (kg)" type="number" min="0.01" max="5000" step="0.01" defaultValue={String(row.weight_kg ?? "")} /><Field name="temperature_c" title="Temperatura (°C)" type="number" min="30" max="45" step="0.1" defaultValue={String(row.temperature_c ?? "")} /></> : <><Field name="applied_at" title="Fecha de aplicación" type="date" defaultValue={String(row.applied_at ?? "").slice(0,10)} /><Field name="due_date" title="Próxima dosis" type="date" required defaultValue={String(row.due_date ?? "").slice(0,10)} /><label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">Notas<textarea name="notes" rows={2} maxLength={500} defaultValue={String(row.notes ?? "")} className="rounded-lg border border-line bg-bg p-2 text-sm font-normal text-ink" /></label></>}<button type="submit" className="ui-button h-10 rounded-lg bg-brand px-3 text-sm font-bold text-on-brand">Guardar cambios</button></Form><Form method="post" className="mt-3" onSubmit={(event) => { if (!window.confirm("¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer.")) event.preventDefault(); }}><input type="hidden" name="intent" value="delete" /><input type="hidden" name="record_id" value={String(row.id ?? "")} /><button type="submit" className="ui-button w-full rounded-lg border border-tone-red-soft px-3 py-2 text-sm font-semibold text-tone-red-fg hover:bg-tone-red-soft">Eliminar registro</button></Form></div></details></td>}
          </tr>)}</tbody>
        </table>
      </div>}
      <div className="border-t border-line bg-surface-muted/40 px-5 py-3 text-xs text-ink-muted">
        {readOnly ? "Historial en modo consulta: no modifica ni elimina datos clínicos." : "Los cambios se validan en servidor y también dependen de las políticas RLS de Supabase."}
      </div>
    </div>
  </section>;
}
