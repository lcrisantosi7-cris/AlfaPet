import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { memo } from "react";
import { Form, useNavigation } from "react-router";
import { cn } from "~/core/lib/cn";
import { formatMoney } from "~/core/lib/format";
import { EmptyState } from "~/core/ui/EmptyState";
import type { PosCatalog } from "../model/sale.types";
import { formatDateTime, PAYMENT_LABEL, PAYMENT_METHODS } from "./sale-labels";
import type { Cart } from "./use-cart";

interface CartPanelProps {
    cart: Cart;
    catalog: PosCatalog;
    isAdmin: boolean;
}

const CONTROL = "ui-field h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm";

/** Las opciones solo se vuelven a dibujar si cambia la lista de clientes, no con cada cambio del carrito. */
const OwnerOptions = memo(function OwnerOptions({ owners }: { owners: PosCatalog["owners"] }) {
    return (
        <>
            {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                    {owner.name}{owner.document ? ` · ${owner.document}` : ""}
                </option>
            ))}
        </>
    );
});

export function CartPanel({ cart, catalog, isAdmin }: CartPanelProps) {
    const submitting = useNavigation().state === "submitting";
    const items = JSON.stringify(cart.lines.map(({ type, id, quantity }) => ({ type, id, quantity })));
    const prescriptionRequired = cart.needsPrescription && !isAdmin;

    return (
        <aside aria-label="Venta actual" className="ui-card rounded-2xl border border-line bg-surface shadow-card xl:sticky xl:top-4">
            <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                <h2 className="flex items-center gap-2 font-bold">
                    <ShoppingCart aria-hidden className="size-5 text-brand" />
                    Venta actual
                    {cart.count > 0 && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand-text">{cart.count}</span>}
                </h2>
                {cart.lines.length > 0 && (
                    <button type="button" onClick={cart.clear} className="text-xs font-semibold text-ink-muted hover:text-tone-red-fg">
                        Vaciar
                    </button>
                )}
            </header>

            {cart.lines.length === 0 ? (
                <EmptyState icon={ShoppingCart} title="El carrito está vacío" description="Agrega productos o servicios desde el catálogo." />
            ) : (
                <Form method="post" className="flex flex-col gap-4 p-5">
                    <input type="hidden" name="intent" value="checkout" />
                    <input type="hidden" name="items" value={items} />

                    <ul className="divide-y divide-line">
                        {cart.lines.map((line) => (
                            <li key={line.key} className="flex items-center gap-3 py-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold leading-snug">{line.name}</p>
                                    <p className="text-xs text-ink-muted tabular-nums">{formatMoney(line.unitPrice)} c/u</p>
                                </div>
                                <div className="flex items-center rounded-lg border border-line">
                                    <button type="button" aria-label={`Quitar una unidad de ${line.name}`} onClick={() => cart.setQuantity(line.key, line.quantity - 1)} className="ui-icon-button flex size-8 items-center justify-center">
                                        <Minus aria-hidden className="size-3.5" />
                                    </button>
                                    <input
                                        aria-label={`Cantidad de ${line.name}`}
                                        inputMode="numeric"
                                        value={line.quantity}
                                        onChange={(event) => cart.setQuantity(line.key, Number(event.target.value.replace(/\D/g, "")))}
                                        className="h-8 w-10 bg-transparent text-center text-sm font-semibold tabular-nums outline-none"
                                    />
                                    <button type="button" aria-label={`Agregar una unidad de ${line.name}`} disabled={line.quantity >= line.maxQuantity} onClick={() => cart.setQuantity(line.key, line.quantity + 1)} className="ui-icon-button flex size-8 items-center justify-center disabled:opacity-40">
                                        <Plus aria-hidden className="size-3.5" />
                                    </button>
                                </div>
                                <span className="w-20 text-right text-sm font-bold tabular-nums">{formatMoney(line.unitPrice * line.quantity)}</span>
                                <button type="button" aria-label={`Quitar ${line.name}`} onClick={() => cart.remove(line.key)} className="ui-icon-button text-ink-muted hover:text-tone-red-fg">
                                    <Trash2 aria-hidden className="size-4" />
                                </button>
                            </li>
                        ))}
                    </ul>

                    <fieldset>
                        <legend className="mb-2 text-sm font-semibold">Método de pago *</legend>
                        <div className="grid grid-cols-3 gap-2">
                            {PAYMENT_METHODS.map((method, index) => (
                                <label key={method} className={cn("ui-button flex h-10 cursor-pointer items-center justify-center rounded-lg border border-line text-xs font-semibold", "has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand-text")}>
                                    <input type="radio" name="paymentMethod" value={method} defaultChecked={index === 0} className="sr-only" />
                                    {PAYMENT_LABEL[method]}
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <label className="flex flex-col gap-1.5 text-sm font-semibold">
                        Cliente (opcional)
                        <select name="ownerId" defaultValue="" className={CONTROL}>
                            <option value="">Venta sin cliente</option>
                            <OwnerOptions owners={catalog.owners} />
                        </select>
                    </label>

                    {cart.needsPrescription && (
                        <label className="flex flex-col gap-1.5 text-sm font-semibold">
                            Receta {prescriptionRequired ? "*" : "(opcional para administración)"}
                            <select name="prescriptionId" required={prescriptionRequired} defaultValue="" className={CONTROL}>
                                <option value="">Seleccionar receta</option>
                                {catalog.prescriptions.map((rx) => (
                                    <option key={rx.id} value={rx.id}>{rx.patientName} · {formatDateTime(rx.createdAt)}</option>
                                ))}
                            </select>
                            <span className="text-xs font-normal text-ink-muted">Hay medicamentos que requieren receta del veterinario.</span>
                        </label>
                    )}

                    <label className="flex flex-col gap-1.5 text-sm font-semibold">
                        Notas
                        <input name="notes" maxLength={500} placeholder="Opcional" className={CONTROL} />
                    </label>

                    <div className="flex items-center justify-between border-t border-line pt-4">
                        <span className="text-sm text-ink-muted">Total estimado</span>
                        <span className="text-2xl font-extrabold tabular-nums">{formatMoney(cart.total)}</span>
                    </div>
                    <button type="submit" disabled={submitting} className="ui-button h-12 rounded-xl bg-brand text-base font-bold text-on-brand disabled:opacity-60">
                        {submitting ? "Registrando…" : `Cobrar ${formatMoney(cart.total)}`}
                    </button>
                    <p className="text-center text-xs text-ink-muted">Los precios y el stock se validan en el servidor al cobrar.</p>
                </Form>
            )}
        </aside>
    );
}