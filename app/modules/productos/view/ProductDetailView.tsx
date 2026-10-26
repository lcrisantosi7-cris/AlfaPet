import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, History, Package, Pencil, Power } from "lucide-react";
import { useEffect } from "react";
import { Form, Link, useActionData, useNavigation, useSearchParams } from "react-router";
import { ConfirmForm } from "~/core/feedback/ConfirmForm";
import { useActionToast } from "~/core/feedback/use-action-toast";
import { formatMoney } from "~/core/lib/format";
import { Badge } from "~/core/ui/Badge";
import { SectionCard } from "~/core/ui/SectionCard";
import { dateLabel } from "~/modules/pacientes/view/patient-labels";
import type { CategoryOption, ProductDetail, ProductoActionResult } from "../model/producto.types";
import { ProductFields } from "./ProductFields";
import { KIND_LABEL, KIND_VARIANT, stockState } from "./producto-labels";

function Info({ label, children }: { label: string; children?: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</dt>
            <dd className="mt-0.5 text-sm">{children || <span className="text-ink-muted">—</span>}</dd>
        </div>
    );
}
const FIELD = "ui-field h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm";

export function ProductDetailView({ product: p, categories }: { product: ProductDetail; categories: CategoryOption[] }) {
    const result = useActionData() as ProductoActionResult | undefined;
    useActionToast(result);
    const busy = useNavigation().state !== "idle";
    const [params, setParams] = useSearchParams();
    const editing = params.get("editar") === "1";
    const s = stockState(p);
    const errs = result && !result.ok ? result.fieldErrors : undefined;

    useEffect(() => { if (result?.ok && result.intent === "update") setParams({}, { replace: true }); }, [result, setParams]);

    return (
        <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
            <Link to="/productos" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-ink-muted hover:text-brand-text"><ArrowLeft aria-hidden className="size-4" />Volver al inventario</Link>

            <header className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight">{p.name}</h1>
                <Badge variant={KIND_VARIANT[p.kind]}>{KIND_LABEL[p.kind]}</Badge>
                <Badge variant={s.variant} dot>{s.label}</Badge>
                {!editing && <Link to="?editar=1" className="ui-button ml-auto inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:border-brand hover:text-brand-text"><Pencil className="size-4" aria-hidden />Editar producto</Link>}
            </header>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="flex min-w-0 flex-col gap-6">
                    {editing ? (
                        <SectionCard title="Editar producto" icon={Pencil}>
                            <Form method="post" className="flex flex-col gap-5">
                                <input type="hidden" name="intent" value="update" />
                                <ProductFields categories={categories} product={p} errors={errs} />
                                <div className="flex justify-end gap-3">
                                    <Link to="?" className="ui-button inline-flex h-11 items-center rounded-xl border border-line px-5 text-sm font-semibold hover:bg-surface-muted">Cancelar</Link>
                                    <button type="submit" disabled={busy} className="ui-button h-11 rounded-xl bg-brand px-6 text-sm font-bold text-on-brand disabled:opacity-60">{busy ? "Guardando…" : "Guardar cambios"}</button>
                                </div>
                            </Form>
                        </SectionCard>
                    ) : (
                        <SectionCard title="Detalle del producto" icon={Package}>
                            <dl className="grid gap-4 sm:grid-cols-3">
                                <Info label="SKU"><span className="font-mono">{p.sku}</span></Info>
                                <Info label="Categoría">{p.category}</Info>
                                <Info label="Marca">{p.brand}</Info>
                                <Info label="Precio de venta">{formatMoney(p.price)}</Info>
                                <Info label="Unidad">{p.unit}</Info>
                                <Info label="Vencimiento">{p.expiresAt ? dateLabel(p.expiresAt) : null}</Info>
                                <Info label="Requiere receta">{p.kind === "farmacia" ? (p.requiresPrescription ? "Sí" : "No") : null}</Info>
                                <Info label="Registrado">{dateLabel(p.createdAt)}</Info>
                                <div className="sm:col-span-3"><Info label="Descripción">{p.description}</Info></div>
                            </dl>
                        </SectionCard>
                    )}

                    <SectionCard title="Movimientos de stock" icon={History}>
                        {p.movements.length === 0 ? <p className="text-sm text-ink-muted">Sin movimientos registrados.</p> : (
                            <ul className="divide-y divide-line">
                                {p.movements.map((m) => (
                                    <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                                        <div><p className="font-semibold">{m.reason}</p><p className="text-xs text-ink-muted">{dateLabel(m.createdAt)}{m.author ? ` · ${m.author}` : ""}</p></div>
                                        <Badge variant={m.delta > 0 ? "success" : "danger"}>{m.delta > 0 ? `+${m.delta}` : m.delta}</Badge>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </SectionCard>
                </div>

                <aside className="flex flex-col gap-6">
                    <SectionCard title="Existencias" icon={Package}>
                        <div className="grid grid-cols-2 gap-3 text-center">
                            <div className="rounded-xl bg-brand-soft p-3"><p className="text-xs text-ink-muted">Actual</p><p className="text-3xl font-extrabold">{p.stock}</p></div>
                            <div className="rounded-xl bg-surface-muted p-3"><p className="text-xs text-ink-muted">Mínimo</p><p className="text-3xl font-extrabold">{p.minStock}</p></div>
                        </div>
                        <Form method="post" className="mt-4 grid gap-3">
                            <input type="hidden" name="intent" value="adjust-stock" />
                            <div className="grid grid-cols-2 gap-2">
                                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm font-semibold has-[:checked]:border-brand has-[:checked]:bg-brand-soft"><input type="radio" name="type" value="entrada" defaultChecked className="sr-only" /><ArrowDownToLine className="size-4" aria-hidden />Entrada</label>
                                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm font-semibold has-[:checked]:border-brand has-[:checked]:bg-brand-soft"><input type="radio" name="type" value="salida" className="sr-only" /><ArrowUpFromLine className="size-4" aria-hidden />Salida</label>
                            </div>
                            <input name="quantity" type="number" min="1" step="1" required placeholder="Cantidad" aria-label="Cantidad" className={FIELD} />
                            <input name="reason" required maxLength={200} placeholder="Motivo (compra, merma, ajuste…)" aria-label="Motivo" className={FIELD} />
                            {errs?.reason?.[0] && <span className="text-xs text-tone-orange-fg">{errs.reason[0]}</span>}
                            <button type="submit" disabled={busy} className="ui-button h-11 rounded-xl bg-brand text-sm font-bold text-on-brand disabled:opacity-60">Registrar movimiento</button>
                        </Form>
                    </SectionCard>

                    <SectionCard title="Estado" icon={Power}>
                        <ConfirmForm method="post" confirm={p.isActive
                            ? { tone: "danger", title: "¿Desactivar este producto?", description: "Dejará de aparecer en Caja. El historial se conserva.", confirmLabel: "Desactivar" }
                            : { title: "¿Reactivar este producto?", description: "Volverá a estar disponible en Caja.", confirmLabel: "Reactivar" }}>
                            <input type="hidden" name="intent" value="toggle-active" /><input type="hidden" name="isActive" value={String(p.isActive)} />
                            <button type="submit" className="ui-button inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-surface-muted"><Power className="size-4" aria-hidden />{p.isActive ? "Desactivar producto" : "Reactivar producto"}</button>
                        </ConfirmForm>
                    </SectionCard>
                </aside>
            </div>
        </section>
    );
}