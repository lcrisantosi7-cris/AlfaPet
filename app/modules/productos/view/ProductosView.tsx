import { AlertTriangle, Boxes, Package, PackageX, Pill, Search, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Form, Link, useActionData, useNavigate } from "react-router";
import { useActionToast } from "~/core/feedback/use-action-toast";
import { formatMoney } from "~/core/lib/format";
import { Badge } from "~/core/ui/Badge";
import { PageHeader } from "~/core/ui/PageHeader";
import type { CategoryOption, ProductoActionResult, ProductRow, ServiceRow } from "../model/producto.types";
import { ProductDialog } from "./ProductDialog";
import { KIND_LABEL, KIND_VARIANT, SERVICE_CATEGORY_LABEL, stockState } from "./producto-labels";

interface Props { products: ProductRow[]; categories: CategoryOption[]; services: ServiceRow[]; isAdmin: boolean }
const KINDS = ["todos", "pet_shop", "farmacia", "insumo"] as const;

export function ProductosView({ products, categories, services, isAdmin }: Props) {
    useActionToast(useActionData() as ProductoActionResult | undefined);
    const navigate = useNavigate();
    const [tab, setTab] = useState<"inventario" | "servicios">("inventario");
    const [kind, setKind] = useState<(typeof KINDS)[number]>("todos");
    const [lowOnly, setLowOnly] = useState(false);
    const [query, setQuery] = useState("");

    const active = products.filter((p) => p.isActive);
    const low = active.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
    const out = active.filter((p) => p.stock <= 0).length;
    const value = active.reduce((s, p) => s + p.price * p.stock, 0);

    const filtered = useMemo(() => {
        const q = query.trim().toLocaleLowerCase("es");
        return products.filter((p) =>
            (kind === "todos" || p.kind === kind) && (!lowOnly || (p.isActive && p.stock <= p.minStock)) &&
            (!q || [p.name, p.sku, p.category].some((v) => v?.toLocaleLowerCase("es").includes(q))));
    }, [products, kind, lowOnly, query]);

    const kpis = [
        { label: "Productos activos", value: active.length, icon: Package, tone: "bg-tone-orange-icon text-tone-orange-fg" },
        { label: "Stock bajo", value: low, icon: AlertTriangle, tone: "bg-tone-amber-soft text-tone-amber-fg" },
        { label: "Agotados", value: out, icon: PackageX, tone: "bg-tone-red-soft text-tone-red-fg" },
        { label: "Valor del inventario", value: formatMoney(value), icon: Wallet, tone: "bg-tone-green-icon text-tone-green-fg" },
    ];
    const groups = useMemo(() => {
        const m = new Map<string, ServiceRow[]>();
        for (const s of services) m.set(s.category, [...(m.get(s.category) ?? []), s]);
        return [...m.entries()];
    }, [services]);

    return (
        <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
            <PageHeader eyebrow="Inventario" title="Productos y servicios" description="Controla existencias, categorías y las tarifas de cada servicio clínico." action={<ProductDialog categories={categories} />} />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {kpis.map(({ label, value: v, icon: Icon, tone }) => (
                    <article key={label} className="ui-card flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
                        <span className={`flex size-12 items-center justify-center rounded-xl ${tone}`}><Icon className="size-6" aria-hidden /></span>
                        <div><p className="text-2xl font-extrabold leading-none">{v}</p><p className="mt-1 text-xs text-ink-muted">{label}</p></div>
                    </article>
                ))}
            </div>

            <div className="flex w-fit gap-1 rounded-xl bg-surface-muted p-1">
                {([["inventario", "Inventario"], ["servicios", "Servicios y tarifas"]] as const).map(([k, l]) => (
                    <button key={k} type="button" onClick={() => setTab(k)} className={`ui-button h-10 rounded-lg px-4 text-sm font-semibold ${tab === k ? "bg-brand text-on-brand shadow-sm" : "text-ink-muted hover:text-ink"}`}>{l}</button>
                ))}
            </div>

            {tab === "inventario" ? (
                <div className="rounded-2xl border border-line bg-surface shadow-card">
                    <div className="flex flex-col gap-3 border-b border-line p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                            <label className="relative min-w-0 flex-1">
                                <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
                                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, SKU o categoría…" className="ui-field h-11 w-full rounded-xl border border-line bg-bg pl-10 pr-3 text-sm" />
                            </label>
                            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} className="size-4 accent-[var(--color-brand)]" />Solo stock bajo</label>
                        </div>
                        <div className="flex flex-wrap gap-1 rounded-xl bg-surface-muted p-1">
                            {KINDS.map((k) => (
                                <button key={k} type="button" onClick={() => setKind(k)} className={`ui-button h-9 rounded-lg px-3 text-xs font-semibold ${kind === k ? "bg-brand text-on-brand shadow-sm" : "text-ink-muted hover:text-ink"}`}>
                                    {k === "todos" ? "Todos" : KIND_LABEL[k]} ({k === "todos" ? products.length : products.filter((p) => p.kind === k).length})
                                </button>
                            ))}
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center px-6 py-16 text-center">
                            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-text"><Pill className="size-7" /></span>
                            <h2 className="mt-4 text-lg font-bold">{kind === "farmacia" ? "Aún no hay productos de farmacia" : "No hay productos para mostrar"}</h2>
                            <p className="mt-1 max-w-md text-sm text-ink-muted">Usa “Registrar producto” y elige el tipo correspondiente.</p>
                        </div>
                    ) : (
                        <div className="ui-table-wrap">
                            <table className="w-full min-w-[820px] text-left text-sm">
                                <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink-muted">
                                    <tr><th className="px-5 py-4">SKU</th><th className="px-5 py-4">Nombre</th><th className="px-5 py-4">Categoría</th><th className="px-5 py-4">Precio</th><th className="px-5 py-4">Existencias</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4 text-right">Acciones</th></tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {filtered.map((p) => {
                                        const s = stockState(p);
                                        return (
                                            <tr key={p.id} onClick={() => navigate(`/productos/${p.id}`)} className="cursor-pointer transition-colors hover:bg-brand-soft/40">
                                                <td className="px-5 py-4 font-mono text-xs text-ink-muted">{p.sku}</td>
                                                <td className="px-5 py-4"><p className="font-bold">{p.name}</p><div className="mt-1 flex gap-1.5"><Badge variant={KIND_VARIANT[p.kind]}>{KIND_LABEL[p.kind]}</Badge>{p.requiresPrescription && <Badge variant="warning">Receta</Badge>}</div></td>
                                                <td className="px-5 py-4 text-ink-muted">{p.category ?? "—"}</td>
                                                <td className="px-5 py-4 font-semibold tabular-nums">{formatMoney(p.price)}</td>
                                                <td className="px-5 py-4 font-semibold tabular-nums">{p.stock}</td>
                                                <td className="px-5 py-4"><Badge variant={s.variant} dot>{s.label}</Badge></td>
                                                <td className="px-5 py-4 text-right"><Link to={`/productos/${p.id}?editar=1`} onClick={(e) => e.stopPropagation()} className="inline-flex rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:border-brand hover:text-brand-text">Editar</Link></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <footer className="border-t border-line px-5 py-3 text-xs text-ink-muted">Mostrando {filtered.length} de {products.length} productos</footer>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {!isAdmin && <p className="rounded-xl bg-brand-soft/60 px-4 py-3 text-sm">Solo administración puede modificar las tarifas.</p>}
                    {groups.map(([cat, list]) => (
                        <div key={cat} className="rounded-2xl border border-line bg-surface shadow-card">
                            <h2 className="flex items-center gap-2 border-b border-line px-5 py-4 text-base font-bold"><Boxes className="size-5 text-brand" aria-hidden />{SERVICE_CATEGORY_LABEL[cat] ?? cat}</h2>
                            <ul className="divide-y divide-line">
                                {list.map((s) => (
                                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                                        <div><p className="font-semibold">{s.name}</p><p className="text-xs text-ink-muted">{s.code}</p></div>
                                        {isAdmin ? (
                                            <Form method="post" className="flex items-center gap-2">
                                                <input type="hidden" name="intent" value="service-price" /><input type="hidden" name="serviceId" value={s.id} />
                                                <span className="text-sm text-ink-muted">S/</span>
                                                <input name="price" type="number" step="0.01" min="0" required defaultValue={s.basePrice} aria-label={`Costo de ${s.name}`} className="ui-field h-10 w-28 rounded-lg border border-line bg-bg px-3 text-sm" />
                                                <button type="submit" className="ui-button h-10 rounded-lg border border-line px-4 text-xs font-semibold hover:border-brand hover:text-brand-text">Guardar</button>
                                            </Form>
                                        ) : <span className="font-bold tabular-nums">{s.basePrice > 0 ? formatMoney(s.basePrice) : <Badge variant="warning">Sin costo definido</Badge>}</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}