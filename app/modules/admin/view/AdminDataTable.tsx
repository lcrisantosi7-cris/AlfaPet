import { useMemo, useState } from "react";
import { Form } from "react-router";
import { Activity, ClipboardList, FileBarChart, Package, Settings2, Syringe } from "lucide-react";
import { AdminField as Field, AdminSelectField as SelectField } from "./AdminFormFields";
import { displayValue, label, pretty, statusTone } from "./admin-format";

type Row = Record<string, unknown>;
type Option = { id: string | number; name: string };
interface AdminDataTableProps {
  moduleKey: string;
  rows: Row[];
  columns: string[];
  readOnly: boolean;
  categories: Option[];
}

const ICONS: Record<string, typeof Activity> = {
  consultas: ClipboardList, historial: Activity, vacunas: Syringe,
  productos: Package, reportes: FileBarChart, configuracion: Settings2,
};

export function AdminDataTable({ moduleKey, rows, columns, readOnly, categories }: AdminDataTableProps) {
  const Icon = ICONS[moduleKey] ?? Activity;
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

  return (
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
  );
}
