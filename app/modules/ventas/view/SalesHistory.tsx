import { Ban, Eye, Receipt } from "lucide-react";
import { useState } from "react";
import { ConfirmForm } from "~/core/feedback/ConfirmForm";
import { LimaTime } from "~/core/lib/lima-time";
import { formatMoney } from "~/core/lib/format";
import { Badge } from "~/core/ui/Badge";
import { EmptyState } from "~/core/ui/EmptyState";
import { Modal } from "~/core/ui/Modal";
import type { SaleSummary } from "../model/sale.types";
import { CHANNEL_LABEL, formatDateTime, PAYMENT_LABEL, saleNumber } from "./sale-labels";

interface SalesHistoryProps {
    sales: SaleSummary[];
    today: string;
    isAdmin: boolean;
}

export function SalesHistory({ sales, today, isAdmin }: SalesHistoryProps) {
    const [selected, setSelected] = useState<SaleSummary | null>(null);
    const todays = sales.filter((s) => LimaTime.dayKey(new Date(s.createdAt)) === today);
    const paidToday = todays.filter((s) => s.status === "pagada");
    const revenue = paidToday.reduce((sum, s) => sum + s.total, 0);

    const stats = [
        { label: "Ventas de hoy", value: String(paidToday.length) },
        { label: "Ingresos de hoy", value: formatMoney(revenue) },
        { label: "Ticket promedio", value: formatMoney(paidToday.length ? revenue / paidToday.length : 0) },
        { label: "Anuladas hoy", value: String(todays.length - paidToday.length) },
    ];

    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {stats.map((stat) => (
                    <article key={stat.label} className="ui-card rounded-2xl border border-line bg-surface p-5 shadow-card">
                        <p className="text-sm text-ink-muted">{stat.label}</p>
                        <p className="mt-2 text-2xl font-extrabold tabular-nums">{stat.value}</p>
                    </article>
                ))}
            </div>

            <div className="ui-card overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
                {sales.length === 0 ? (
                    <EmptyState icon={Receipt} title="Aún no hay ventas" description="Las ventas que registres en Caja aparecerán aquí." />
                ) : (
                    <div className="ui-table-wrap">
                        <table className="w-full min-w-[860px] text-left text-sm">
                            <caption className="sr-only">Últimas ventas registradas</caption>
                            <thead className="bg-surface-muted text-xs tracking-wide text-ink-muted uppercase">
                                <tr>
                                    {["N°", "Fecha", "Canal", "Cliente", "Pago", "Total", "Estado", "Detalle"].map((h) => (
                                        <th key={h} scope="col" className="px-4 py-3.5 font-semibold">{h}</th>
                                    ))}
                                    {isAdmin && <th scope="col" className="px-4 py-3.5 font-semibold">Acción</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {sales.map((sale) => (
                                    <tr key={sale.id} className="ui-table-row align-top">
                                        <th scope="row" className="px-4 py-3.5 font-bold tabular-nums">{saleNumber(sale.number)}</th>
                                        <td className="px-4 py-3.5 text-ink-muted">{formatDateTime(sale.createdAt)}</td>
                                        <td className="px-4 py-3.5"><Badge variant="brand">{CHANNEL_LABEL[sale.channel]}</Badge></td>
                                        <td className="px-4 py-3.5">{sale.ownerName ?? <span className="text-ink-muted">Sin cliente</span>}</td>
                                        <td className="px-4 py-3.5">{PAYMENT_LABEL[sale.paymentMethod]}</td>
                                        <td className="px-4 py-3.5 font-bold tabular-nums">{formatMoney(sale.total)}</td>
                                        <td className="px-4 py-3.5">
                                            <Badge variant={sale.status === "pagada" ? "success" : "danger"}>{sale.status === "pagada" ? "Pagada" : "Anulada"}</Badge>
                                            {sale.voidReason && <p className="mt-1 max-w-48 text-xs text-ink-muted">{sale.voidReason}</p>}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <button type="button" onClick={() => setSelected(sale)} className="ui-button inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:border-brand hover:text-brand-text">
                                                <Eye aria-hidden className="size-3.5" />Ver ({sale.items.length})
                                            </button>
                                        </td>
                                        {isAdmin && (
                                            <td className="px-4 py-3.5">
                                                {sale.status === "pagada" && (
                                                    <ConfirmForm
                                                        method="post"
                                                        className="flex items-center gap-2"
                                                        confirm={{
                                                            tone: "danger",
                                                            title: `¿Anular la venta ${saleNumber(sale.number)}?`,
                                                            description: "Se devolverá el stock al inventario. Esta acción no se puede deshacer.",
                                                            confirmLabel: "Anular venta",
                                                        }}
                                                    >
                                                        <input type="hidden" name="intent" value="void" />
                                                        <input type="hidden" name="saleId" value={sale.id} />
                                                        <input name="reason" required minLength={3} maxLength={300} aria-label="Motivo de anulación" placeholder="Motivo" className="ui-field h-9 w-32 rounded-lg border border-line bg-bg px-2 text-xs" />
                                                        <button type="submit" aria-label={`Anular venta ${saleNumber(sale.number)}`} className="ui-icon-button text-ink-muted hover:text-tone-red-fg">
                                                            <Ban aria-hidden className="size-4" />
                                                        </button>
                                                    </ConfirmForm>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <footer className="border-t border-line px-5 py-3 text-xs text-ink-muted">Se muestran las 150 ventas más recientes.</footer>
            </div>
            <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? `Venta ${saleNumber(selected.number)}` : "Venta"}>
                {selected && (
                    <div className="flex flex-col gap-5">
                        <dl className="grid gap-3 text-sm sm:grid-cols-2">
                            <div><dt className="text-xs font-semibold text-ink-muted uppercase">Fecha</dt><dd>{formatDateTime(selected.createdAt)}</dd></div>
                            <div><dt className="text-xs font-semibold text-ink-muted uppercase">Canal</dt><dd>{CHANNEL_LABEL[selected.channel]}</dd></div>
                            <div><dt className="text-xs font-semibold text-ink-muted uppercase">Cliente</dt><dd>{selected.ownerName ?? "Sin cliente"}</dd></div>
                            <div><dt className="text-xs font-semibold text-ink-muted uppercase">Pago</dt><dd>{PAYMENT_LABEL[selected.paymentMethod]}</dd></div>
                            <div><dt className="text-xs font-semibold text-ink-muted uppercase">Vendedor</dt><dd>{selected.sellerName ?? "—"}</dd></div>
                            <div><dt className="text-xs font-semibold text-ink-muted uppercase">Estado</dt><dd><Badge variant={selected.status === "pagada" ? "success" : "danger"}>{selected.status === "pagada" ? "Pagada" : "Anulada"}</Badge></dd></div>
                            {selected.voidReason && <div className="sm:col-span-2"><dt className="text-xs font-semibold text-ink-muted uppercase">Motivo de anulación</dt><dd>{selected.voidReason}</dd></div>}
                        </dl>
                        <div className="overflow-x-auto rounded-xl border border-line">
                            <table className="w-full min-w-[420px] text-left text-sm">
                                <thead className="bg-surface-muted text-xs text-ink-muted uppercase"><tr><th className="px-3 py-2">Descripción</th><th className="px-3 py-2 text-right">Cant.</th><th className="px-3 py-2 text-right">P. unit.</th><th className="px-3 py-2 text-right">Subtotal</th></tr></thead>
                                <tbody className="divide-y divide-line">
                                    {selected.items.map((item, i) => (
                                        <tr key={i}><td className="px-3 py-2">{item.description}</td><td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td><td className="px-3 py-2 text-right tabular-nums">{formatMoney(item.unitPrice)}</td><td className="px-3 py-2 text-right font-semibold tabular-nums">{formatMoney(item.subtotal)}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-right text-lg font-extrabold">Total: {formatMoney(selected.total)}</p>
                    </div>
                )}
            </Modal>
        </div>
    );
}