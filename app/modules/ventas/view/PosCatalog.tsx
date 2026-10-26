import { Package, Pill, Plus, Search, Stethoscope } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { cn } from "~/core/lib/cn";
import { formatMoney } from "~/core/lib/format";
import { Badge } from "~/core/ui/Badge";
import { EmptyState } from "~/core/ui/EmptyState";
import type { PosCatalog as Catalog } from "../model/sale.types";
import type { Cart } from "./use-cart";

const TABS = [
    { key: "pet_shop", label: "Pet Shop", icon: Package },
    { key: "farmacia", label: "Farmacia", icon: Pill },
    { key: "servicios", label: "Servicios", icon: Stethoscope },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/** Cuántas tarjetas se dibujan a la vez: con catálogos grandes mantiene la caja fluida. */
const PAGE_SIZE = 48;

interface Item {
    id: string | number;
    type: "product" | "service";
    name: string;
    detail: string | null;
    price: number;
    stock: number | null;
    requiresPrescription: boolean;
}

function toItems(catalog: Catalog, tab: TabKey): Item[] {
    if (tab === "servicios") {
        return catalog.services.map((s) => ({
            id: s.id, type: "service", name: s.name, detail: null, price: s.price, stock: null, requiresPrescription: false,
        }));
    }
    return catalog.products
        .filter((p) => p.kind === tab)
        .map((p) => ({
            id: p.id, type: "product", name: p.name, detail: p.category ?? p.sku, price: p.price,
            stock: p.stock, requiresPrescription: p.requiresPrescription,
        }));
}

const ProductCard = memo(function ProductCard({ item, onAdd }: { item: Item; onAdd: Cart["add"] }) {
    const soldOut = item.stock !== null && item.stock <= 0;
    return (
        <li className="ui-card flex flex-col gap-3 rounded-xl border border-line bg-bg p-4">
            <div className="min-w-0">
                <p className="font-bold leading-snug">{item.name}</p>
                {item.detail && <p className="mt-0.5 truncate text-xs text-ink-muted">{item.detail}</p>}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {item.requiresPrescription && <Badge variant="warning">Requiere receta</Badge>}
                {item.stock !== null && (
                    <Badge variant={soldOut ? "danger" : item.stock <= 5 ? "warning" : "success"}>
                        {soldOut ? "Agotado" : `${item.stock} en stock`}
                    </Badge>
                )}
            </div>
            <div className="mt-auto flex items-center justify-between gap-2">
                <span className="text-lg font-extrabold tabular-nums">{formatMoney(item.price)}</span>
                <button
                    type="button"
                    disabled={soldOut}
                    onClick={() =>
                        onAdd({
                            type: item.type, id: item.id, name: item.name, unitPrice: item.price,
                            maxQuantity: item.stock ?? 0, requiresPrescription: item.requiresPrescription,
                        })
                    }
                    className="ui-button inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-bold text-on-brand disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Plus aria-hidden className="size-4" />
                    Agregar
                </button>
            </div>
        </li>
    );
});

export const PosCatalog = memo(function PosCatalog({ catalog, onAdd }: { catalog: Catalog; onAdd: Cart["add"] }) {
    const [tab, setTab] = useState<TabKey>("pet_shop");
    const [query, setQuery] = useState("");
    const [limit, setLimit] = useState(PAGE_SIZE);

    const items = useMemo(() => {
        const q = query.trim().toLocaleLowerCase("es");
        return toItems(catalog, tab).filter((item) => !q || `${item.name} ${item.detail ?? ""}`.toLocaleLowerCase("es").includes(q));
    }, [catalog, tab, query]);

    const shown = items.slice(0, limit);
    const Icon = TABS.find((t) => t.key === tab)!.icon;

    return (
        <section aria-label="Catálogo de venta" className="ui-card rounded-2xl border border-line bg-surface shadow-card">
            <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
                <div role="tablist" aria-label="Categoría" className="flex gap-1 rounded-xl bg-surface-muted p-1">
                    {TABS.map(({ key, label, icon: TabIcon }) => (
                        <button
                            key={key}
                            role="tab"
                            type="button"
                            aria-selected={tab === key}
                            onClick={() => { setTab(key); setLimit(PAGE_SIZE); }}
                            className={cn(
                                "ui-button inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold",
                                tab === key ? "bg-surface text-brand-text shadow-sm" : "text-ink-muted hover:text-ink",
                            )}
                        >
                            <TabIcon aria-hidden className="size-4" />
                            {label}
                        </button>
                    ))}
                </div>
                <label className="relative min-w-0 flex-1">
                    <span className="sr-only">Buscar en el catálogo</span>
                    <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
                    <input
                        value={query}
                        onChange={(event) => { setQuery(event.target.value); setLimit(PAGE_SIZE); }}
                        placeholder="Buscar por nombre, categoría o código…"
                        className="ui-field h-11 w-full rounded-xl border border-line bg-bg pr-3 pl-10 text-sm"
                    />
                </label>
            </div>

            <div role="tabpanel" className="p-4">
                {items.length === 0 ? (
                    <EmptyState
                        icon={Icon}
                        title={query ? "Sin coincidencias" : "Nada para vender aquí todavía"}
                        description={query ? "Prueba con otro nombre o código." : "Agrega productos o servicios activos desde Productos y Configuración."}
                    />
                ) : (
                    <>
                        <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                            {shown.map((item) => (
                                <ProductCard key={`${item.type}:${item.id}`} item={item} onAdd={onAdd} />
                            ))}
                        </ul>
                        {items.length > shown.length && (
                            <div className="mt-4 flex flex-col items-center gap-2">
                                <p className="text-xs text-ink-muted">Mostrando {shown.length} de {items.length}. Usa el buscador para acotar.</p>
                                <button type="button" onClick={() => setLimit((n) => n + PAGE_SIZE)} className="ui-button h-10 rounded-xl border border-line px-5 text-sm font-semibold hover:border-brand hover:text-brand-text">
                                    Mostrar más
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
});