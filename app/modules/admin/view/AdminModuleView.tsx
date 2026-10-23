import { Activity, ClipboardList, FileBarChart, Package, Settings2, Syringe } from "lucide-react";

type Row = Record<string, unknown>;
type Metric = { label: string; value: number | null; unavailable: boolean };
type Props = { moduleKey: string; title: string; rows: Row[]; metrics: Metric[]; columns: string[]; readOnly: boolean };

const ICONS: Record<string, typeof Activity> = {
  consultas: ClipboardList, historial: Activity, vacunas: Syringe,
  productos: Package, reportes: FileBarChart, configuracion: Settings2,
};
const LABELS: Record<string, string> = {
  consultations: "Consultas", patients: "Pacientes", appointments: "Citas",
  vaccinations: "Vacunaciones", products: "Productos",
  diagnosis: "Diagnóstico", treatment: "Tratamiento", symptoms: "Síntomas",
  created_at: "Fecha de registro", weight_kg: "Peso (kg)", temperature_c: "Temperatura (°C)",
  name: "Nombre", species: "Especie", breed: "Raza", stock: "Existencias",
  price: "Precio", full_name: "Nombre completo", phone: "Teléfono", email: "Correo",
  role: "Rol", is_active: "Activo", notes: "Notas", status: "Estado",
};
function pretty(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
function label(value: string) {
  return LABELS[value] ?? value.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
}

export function AdminModuleView({ moduleKey, title, rows, metrics, columns, readOnly }: Props) {
  const Icon = ICONS[moduleKey] ?? Activity;
  return <section className="mx-auto flex max-w-[1500px] flex-col gap-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-text">Administración · AlfaPet</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Información consultada desde Supabase y sujeta a los permisos de tu sesión.
        </p>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-text"><Icon className="size-5" /></span>
        <div><p className="text-xs text-ink-muted">Estado de la vista</p><p className="font-semibold">Datos reales · Solo lectura</p></div>
      </div>
    </header>

    {metrics.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric) => <article key={metric.label} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <p className="text-sm text-ink-muted">{label(metric.label)}</p>
        <p className="mt-2 text-3xl font-extrabold">{metric.unavailable ? "—" : metric.value ?? 0}</p>
        <p className="mt-1 text-xs text-ink-muted">{metric.unavailable ? "No disponible por permisos o configuración" : "Registros en Supabase"}</p>
      </article>)}
    </div> : null}

    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex flex-col gap-1 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-bold">{moduleKey === "configuracion" ? "Perfil de la sesión" : "Registros"}</h2>
        <span className="text-xs text-ink-muted">{rows.length} registros mostrados{rows.length === 300 ? " · límite de 300" : ""}</span>
      </div>
      {rows.length === 0 ? <div className="flex flex-col items-center px-6 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-text"><Icon className="size-6" /></span>
        <h3 className="mt-4 font-bold">No hay registros para mostrar</h3>
        <p className="mt-1 max-w-md text-sm text-ink-muted">No se encontraron datos visibles para esta sección. Comprueba las políticas RLS y que existan registros en Supabase.</p>
      </div> : <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink-muted"><tr>{columns.map((column) => <th key={column} className="px-5 py-4">{label(column)}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">{rows.map((row, index) => <tr key={String(row.id ?? index)} className="hover:bg-surface-muted/60">
            {columns.map((column) => <td key={column} className="max-w-sm px-5 py-4 align-top">
              <span className={column === "diagnosis" || column === "name" || column === "full_name" ? "font-semibold" : ""}>{pretty(row[column])}</span>
            </td>)}
          </tr>)}</tbody>
        </table>
      </div>}
      <div className="border-t border-line bg-surface-muted/40 px-5 py-3 text-xs text-ink-muted">
        {readOnly ? "Esta versión no modifica datos clínicos ni de inventario. Los cambios requieren formularios validados y acciones protegidas en servidor." : ""}
      </div>
    </div>
  </section>;
}
