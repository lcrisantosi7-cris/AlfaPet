import { ArrowLeft, ClipboardCheck, FileText, Scissors } from "lucide-react";
import { Link, useActionData } from "react-router";
import { useActionToast } from "~/core/feedback/use-action-toast";
import { formatMoney } from "~/core/lib/format";
import { Badge } from "~/core/ui/Badge";
import { SectionCard } from "~/core/ui/SectionCard";
import type { CirugiasResult, SurgeryDetail } from "../model/surgery.types";
import { ChecklistForm } from "./ChecklistForm";
import { NotesForm } from "./NotesForm";
import { formatDateTime, STATUS_LABEL, STATUS_VARIANT } from "./surgery-labels";
import { WorkflowActions } from "./WorkflowActions";

function Info({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</dt>
            <dd className="mt-0.5 text-sm">{children || <span className="text-ink-muted">—</span>}</dd>
        </div>
    );
}

export function SurgeryDetailView({ surgery: s }: { surgery: SurgeryDetail }) {
    useActionToast(useActionData<CirugiasResult>());

    return (
        <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
            <Link to="/cirugias" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-ink-muted hover:text-brand-text">
                <ArrowLeft aria-hidden className="size-4" />
                Volver a la agenda
            </Link>

            <header className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight">{s.patientName}</h1>
                <Badge variant={STATUS_VARIANT[s.status]} dot pulse={s.status === "en_curso"}>{STATUS_LABEL[s.status]}</Badge>
                <span className="text-ink-muted">{s.procedure}</span>
            </header>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="flex min-w-0 flex-col gap-6">
                    <SectionCard title="Datos de la cirugía" icon={Scissors}>
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <Info label="Paciente">{s.species}{s.breed ? ` · ${s.breed}` : ""}</Info>
                            <Info label="Propietario">{s.ownerName}{s.ownerPhone ? ` · ${s.ownerPhone}` : ""}</Info>
                            <Info label="Cirujano">{s.surgeonName}</Info>
                            <Info label="Programada para">{formatDateTime(s.scheduledAt)}</Info>
                            <Info label="Precio">{formatMoney(s.price)}</Info>
                            <Info label="Inicio / fin">
                                {s.startedAt ? formatDateTime(s.startedAt) : ""}{s.endedAt ? ` → ${formatDateTime(s.endedAt)}` : ""}
                            </Info>
                        </dl>
                    </SectionCard>

                    <SectionCard title="Registro clínico" icon={FileText}>
                        <NotesForm surgery={s} />
                    </SectionCard>
                </div>

                <aside className="flex flex-col gap-6">
                    <SectionCard title="Lista previa" icon={ClipboardCheck}>
                        <ChecklistForm surgery={s} />
                    </SectionCard>
                    <SectionCard title="Acciones" icon={Scissors}>
                        <WorkflowActions surgery={s} />
                    </SectionCard>
                </aside>
            </div>
        </section>
    );
}