import { Form, useActionData } from "react-router";
import { Activity, ClipboardList, FileBarChart, Package, Settings2, Syringe } from "lucide-react";
import { PageHeader } from "~/core/ui/PageHeader";
import { AdminField as Field, AdminSelectField as SelectField } from "./AdminFormFields";
import { AdminDataTable } from "./AdminDataTable";
import { pretty } from "./admin-format";

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
export function AdminModuleView({ moduleKey, title, rows, metrics, columns, readOnly, patients, appointments, vaccines, reportFilters, categories = [], veterinarians = [] }: Props) {
  const Icon = ICONS[moduleKey] ?? Activity;
  const actionData = useActionData() as ActionResult | undefined;
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
      <button type="submit" className="ui-button mt-4 h-11 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand hover:shadow-card">Guardar cambios</button>
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
          <div className="sm:col-span-2"><button type="submit" className="ui-button h-10 rounded-xl border border-line px-4 text-sm font-semibold hover:border-brand hover:text-brand-text">Guardar perfil de veterinario</button></div>
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
      <button type="submit" className="ui-button h-11 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand">Aplicar período</button>
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

    <AdminDataTable
      moduleKey={moduleKey}
      rows={rows}
      columns={columns}
      readOnly={readOnly}
      categories={categories}
    />
  </section>;
}
