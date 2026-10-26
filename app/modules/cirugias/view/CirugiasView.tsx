import { CheckCircle2, Scissors, XCircle } from "lucide-react";
import { Link } from "react-router";
import { cn } from "~/core/lib/cn";
import { formatMoney } from "~/core/lib/format";
import { Badge } from "~/core/ui/Badge";
import { EmptyState } from "~/core/ui/EmptyState";
import { PageHeader } from "~/core/ui/PageHeader";
import type { SurgeonOption, SurgeryPatientOption, SurgeryRow, SurgeryServiceOption } from "../model/surgery.types";
import { ScheduleDialog } from "./ScheduleDialog";
import { formatDateTime, STATUS_LABEL, STATUS_VARIANT } from "./surgery-labels";

type Estado = "programada" | "en_curso" | "completada" | "cancelada" | "todas";

interface CirugiasViewProps {
    surgeries: SurgeryRow[];
    patients: SurgeryPatientOption[];
    procedures: SurgeryServiceOption[];
    surgeons: SurgeonOption[];
    estado: Estado;
    isAdmin: boolean;
    nowLocal: string;
}

const TABS: { key: Estado; label: string }[] = [
    { key: "programada", label: "Programadas" },
    { key: "en_curso", label: "En curso" },
    { key: "completada", label: "Completadas" },
    { key: "cancelada", label: "Canceladas" },
    { key: "todas", label: "Todas" },
];

function Check({ done, label }: { done: boolean; label: string }) {
    const Icon = done ? CheckCircle2 : XCircle;
    return (
        <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", done ? "text-tone-green-fg" : "text-tone-red-fg")}>
            <Icon aria-hidden className="size-4" />
            {label}
            <span className="sr-only">{done ? ": listo" : ": pendiente"}</span>
        </span>
    );
}

export function CirugiasView({ surgeries, patients, procedures, surgeons, estado, isAdmin, nowLocal }: CirugiasViewProps) {
    const count = (status: Estado) => (status === "todas" ? surgeries.length : surgeries.filter((s) => s.status === status).length);
    const visible = surgeries.filter((s) => estado === "todas" || s.status === estado);
    if (estado === "programada" || estado === "en_curso") visible.reverse(); // agenda: la más próxima primero

    return (
        <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
            <PageHeader
                eyebrow="Atención clínica"
                title="Cirugías"
                description="Agenda quirúrgica con lista previa obligatoria: no se puede iniciar una cirugía sin consentimiento firmado."
                action={<ScheduleDialog patients={patients} procedures={procedures} surgeons={surgeons} isAdmin={isAdmin} nowLocal={nowLocal} />}
            />

            <nav aria-label="Estado de la cirugía" className="flex flex-wrap gap-1 border-b border-line">
                {TABS.map((tab) => (
                    <Link
                        key={tab.key}
                        to={`/cirugias?estado=${tab.key}`}
                        aria-current={estado === tab.key ? "page" : undefined}
                        className={cn(
                            "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                            estado === tab.key ? "border-brand text-brand-text" : "border-transparent text-ink-muted hover:text-ink",
                        )}
                    >
                        {tab.label}
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs tabular-nums">{count(tab.key)}</span>
                    </Link>
                ))}
            </nav>

            <div className="ui-card overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
                {visible.length === 0 ? (
                    <EmptyState icon={Scissors} title="No hay cirugías en esta vista" description="Programa una nueva cirugía con el botón de arriba." />
                ) : (
                    <div className="ui-table-wrap">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <caption className="sr-only">Agenda quirúrgica</caption>
                            <thead className="bg-surface-muted text-xs tracking-wide text-ink-muted uppercase">
                                <tr>
                                    {["Fecha", "Paciente", "Procedimiento", "Cirujano", "Lista previa", "Precio", "Estado", ""].map((h, i) => (
                                        <th key={i} scope="col" className="px-4 py-3.5 font-semibold">{h || <span className="sr-only">Abrir</span>}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {visible.map((s) => (
                                    <tr key={s.id} className="ui-table-row">
                                        <td className="px-4 py-3.5 whitespace-nowrap">{formatDateTime(s.scheduledAt)}</td>
                                        <th scope="row" className="px-4 py-3.5 font-bold">{s.patientName}<span className="block text-xs font-normal text-ink-muted">{s.species}</span></th>
                                        <td className="px-4 py-3.5">{s.procedure}</td>
                                        <td className="px-4 py-3.5">{s.surgeonName ?? <span className="text-ink-muted">—</span>}</td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex flex-col gap-1">
                                                <Check done={s.consentSigned} label="Consentimiento" />
                                                <Check done={s.fastingConfirmed} label="Ayuno" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 font-semibold tabular-nums">{formatMoney(s.price)}</td>
                                        <td className="px-4 py-3.5"><Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge></td>
                                        <td className="px-4 py-3.5 text-right">
                                            <Link to={`/cirugias/${s.id}`} className="text-sm font-semibold text-brand-text hover:underline">Abrir</Link>
                                        </td>
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