import { FlaskConical } from "lucide-react";
import { Link } from "react-router";
import { cn } from "~/core/lib/cn";
import { Badge } from "~/core/ui/Badge";
import { EmptyState } from "~/core/ui/EmptyState";
import { PageHeader } from "~/core/ui/PageHeader";
import type { LabAnalysisOption, LabOrderRow, LabPatientOption, LabStatus } from "../model/lab.types";
import { formatDateTime, STATUS_LABEL, STATUS_VARIANT } from "./lab-labels";
import { NewOrderDialog } from "./NewOrderDialog";

type Estado = "pendientes" | "completados" | "cancelados" | "todos";

interface AnalisisViewProps {
    orders: LabOrderRow[];
    patients: LabPatientOption[];
    analyses: LabAnalysisOption[];
    estado: Estado;
    clinical: boolean;
}

const PENDING: LabStatus[] = ["solicitado", "muestra_tomada", "en_proceso"];

const TABS: { key: Estado; label: string; match: (status: LabStatus) => boolean }[] = [
    { key: "pendientes", label: "Pendientes", match: (s) => PENDING.includes(s) },
    { key: "completados", label: "Completados", match: (s) => s === "completado" },
    { key: "cancelados", label: "Cancelados", match: (s) => s === "cancelado" },
    { key: "todos", label: "Todos", match: () => true },
];

export function AnalisisView({ orders, patients, analyses, estado, clinical }: AnalisisViewProps) {
    const current = TABS.find((t) => t.key === estado) ?? TABS[0]!;
    const visible = orders.filter((o) => current.match(o.status));

    return (
        <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
            <PageHeader
                eyebrow={clinical ? "Laboratorio clínico" : "Vista de recepción"}
                title="Análisis clínicos"
                description={clinical
                    ? "Solicita análisis, registra la toma de muestra y captura los resultados de cada orden."
                    : "Consulta el estado de las órdenes. Los resultados solo los ve el personal veterinario."}
                action={clinical ? <NewOrderDialog patients={patients} analyses={analyses} /> : undefined}
            />

            <nav aria-label="Estado de la orden" className="flex flex-wrap gap-1 border-b border-line">
                {TABS.map((tab) => (
                    <Link
                        key={tab.key}
                        to={`/analisis?estado=${tab.key}`}
                        aria-current={estado === tab.key ? "page" : undefined}
                        className={cn(
                            "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                            estado === tab.key ? "border-brand text-brand-text" : "border-transparent text-ink-muted hover:text-ink",
                        )}
                    >
                        {tab.label}
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs tabular-nums">{orders.filter((o) => tab.match(o.status)).length}</span>
                    </Link>
                ))}
            </nav>

            <div className="ui-card overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
                {visible.length === 0 ? (
                    <EmptyState icon={FlaskConical} title="No hay órdenes en esta vista" description={clinical ? "Crea una nueva orden con el botón de arriba." : undefined} />
                ) : (
                    <div className="ui-table-wrap">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <caption className="sr-only">Órdenes de análisis</caption>
                            <thead className="bg-surface-muted text-xs tracking-wide text-ink-muted uppercase">
                                <tr>
                                    <th scope="col" className="px-4 py-3.5 font-semibold">Fecha</th>
                                    <th scope="col" className="px-4 py-3.5 font-semibold">Paciente</th>
                                    {clinical && <th scope="col" className="px-4 py-3.5 font-semibold">Resultados</th>}
                                    <th scope="col" className="px-4 py-3.5 font-semibold">Solicitó</th>
                                    <th scope="col" className="px-4 py-3.5 font-semibold">Estado</th>
                                    {clinical && <th scope="col" className="px-4 py-3.5"><span className="sr-only">Abrir</span></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {visible.map((o) => (
                                    <tr key={o.id} className="ui-table-row">
                                        <td className="px-4 py-3.5 whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
                                        <th scope="row" className="px-4 py-3.5 font-bold">{o.patientName}<span className="block text-xs font-normal text-ink-muted">{o.species}</span></th>
                                        {clinical && <td className="px-4 py-3.5 tabular-nums">{o.resultedCount} / {o.itemCount}</td>}
                                        <td className="px-4 py-3.5">{o.requesterName ?? <span className="text-ink-muted">—</span>}</td>
                                        <td className="px-4 py-3.5"><Badge variant={STATUS_VARIANT[o.status]}>{STATUS_LABEL[o.status]}</Badge></td>
                                        {clinical && (
                                            <td className="px-4 py-3.5 text-right">
                                                <Link to={`/analisis/${o.id}`} className="text-sm font-semibold text-brand-text hover:underline">Abrir</Link>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}