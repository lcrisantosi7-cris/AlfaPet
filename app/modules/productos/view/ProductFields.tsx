import { useState } from "react";
import type { CategoryOption, ProductDetail } from "../model/producto.types";
import { KIND_LABEL, UNITS } from "./producto-labels";

interface Props {
    categories: CategoryOption[];
    product?: ProductDetail;
    withStock?: boolean;
    errors?: Record<string, string[] | undefined>;
}
const FIELD = "ui-field h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm font-normal";
const LABEL = "flex flex-col gap-1.5 text-sm font-semibold";

export function ProductFields({ categories, product: p, withStock = false, errors }: Props) {
    const [kind, setKind] = useState<string>(p?.kind ?? "pet_shop");
    const Err = ({ k }: { k: string }) => (errors?.[k]?.[0] ? <span className="text-xs font-normal text-tone-orange-fg">{errors[k]![0]}</span> : null);

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <label className={`${LABEL} sm:col-span-2`}>Nombre *<input name="name" required maxLength={120} defaultValue={p?.name} className={FIELD} /><Err k="name" /></label>
            <label className={LABEL}>SKU *<input name="sku" required maxLength={40} defaultValue={p?.sku} className={`${FIELD} uppercase`} /><Err k="sku" /></label>
            <label className={LABEL}>Tipo *
                <select name="kind" required value={kind} onChange={(e) => setKind(e.target.value)} className={FIELD}>
                    {Object.entries(KIND_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <Err k="kind" />
            </label>
            <label className={LABEL}>Categoría
                <select name="categoryId" defaultValue={p?.categoryId ?? ""} className={FIELD}>
                    <option value="">Sin categoría</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Err k="categoryId" />
            </label>
            <label className={LABEL}>Marca<input name="brand" maxLength={80} defaultValue={p?.brand ?? ""} className={FIELD} /></label>
            <label className={LABEL}>Precio de venta (S/) *<input name="price" type="number" step="0.01" min="0" required defaultValue={p?.price} className={FIELD} /><Err k="price" /></label>
            <label className={LABEL}>Unidad
                <select name="unit" defaultValue={p?.unit ?? "unidad"} className={FIELD}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
            </label>
            {withStock && <label className={LABEL}>Stock inicial<input name="stock" type="number" min="0" step="1" defaultValue={0} className={FIELD} /><Err k="stock" /></label>}
            <label className={LABEL}>Stock mínimo (alerta)<input name="minStock" type="number" min="0" step="1" defaultValue={p?.minStock ?? 0} className={FIELD} /><Err k="minStock" /></label>
            <label className={LABEL}>Fecha de vencimiento<input name="expiresAt" type="date" defaultValue={p?.expiresAt ?? ""} className={FIELD} /></label>
            {kind === "farmacia" && (
                <label className="flex items-center gap-3 rounded-xl border border-line bg-bg px-3 py-3 text-sm font-semibold sm:col-span-2">
                    <input type="checkbox" name="requiresPrescription" defaultChecked={p?.requiresPrescription} className="size-4 accent-[var(--color-brand)]" />
                    Requiere receta médica
                </label>
            )}
            <label className={`${LABEL} sm:col-span-2`}>Descripción
                <textarea name="description" rows={3} maxLength={500} defaultValue={p?.description ?? ""} className="ui-field w-full rounded-xl border border-line bg-bg p-3 text-sm font-normal" />
            </label>
        </div>
    );
}