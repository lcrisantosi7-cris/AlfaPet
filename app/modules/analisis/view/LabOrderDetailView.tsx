import { ArrowLeft, ClipboardList, FlaskConical, Info as InfoIcon } from "lucide-react";
import { Link, useActionData } from "react-router";
import { useActionToast } from "~/core/feedback/use-action-toast";
import { formatMoney } from "~/core/lib/format";
import { Badge } from "~/core/ui/Badge";
import { SectionCard } from "~/core/ui/SectionCard";
import type { AnalisisResult, LabOrderDetail } from "../model/lab.types";
import { formatDateTime, STATUS_LABEL, STATUS_VARIANT } from "./lab-labels";
import { LabWorkflow } from "./LabWorkflow";
import { ResultForm } from "./ResultForm";

function Info({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</dt>
            <dd className="mt-0.5 text-sm">{children || <span className="text-ink-muted">—</span>}</dd>
        </div>
    );
}

export function LabOrderDetailView({ order }: { order: LabOrderDetail }) {
    useActionToast(useActionData<AnalisisResult>());
    const editable = order.status === "muestra_tomada" || order.status === "en_proceso";
    const total = order.items.reduce((sum, item) => sum + item.price, 0);

    return (
        <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
            <Link to="/analisis" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-ink-muted hover:text-brand-text">
                <ArrowLeft aria-hidden className="size-4" />
                Volver a las órdenes
            </Link>

            <header className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight">{order.patientName}</h1>
                <Badge variant={STATUS_VARIANT[order.status]} dot pulse={order.status === "en_proceso"}>{STATUS_LABEL[order.status]}</Badge>
            </header>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="flex min-w-0 flex-col gap-6">
                    <SectionCard title="Datos de la orden" icon={InfoIcon}>
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <Info label="Paciente">{order.species}{order.breed ? ` · ${order.breed}` : ""}</Info>
                            <Info label="Propietario">{order.ownerName}</Info>
                            <Info label="Solicitada por">{order.requesterName}</Info>
                            <Info label="Fecha">{formatDateTime(order.createdAt)}</Info>
                            <Info label="Total de análisis">{formatMoney(total)}</Info>
                            <Info label="Notas clínicas">{order.notes}</Info>
                        </dl>
                    </SectionCard>

                    <SectionCard title="Resultados" icon={ClipboardList}>
                        {!editable && order.status === "solicitado" && (
                            <p className="mb-4 rounded-xl bg-surface-muted p-3 text-sm text-ink-muted">Registra la toma de muestra para poder capturar resultados.</p>
                        )}
                        <div className="flex flex-col gap-4">
                            {order.items.map((item) => (
                                <ResultForm key={`${item.id}:${item.resultedAt ?? ""}`} orderId={order.id} item={item} editable={editable} />
                            ))}
                        </div>
                    </SectionCard>
                </div>

                <aside className="flex flex-col gap-6">
                    <SectionCard title="Avance de la orden" icon={FlaskConical}>
                        <LabWorkflow order={order} />
                    </SectionCard>
                </aside>
            </div>
        </section>
    );
}