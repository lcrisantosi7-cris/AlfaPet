import { ArrowLeft, BedDouble, ClipboardList, HeartPulse, Thermometer, Weight } from "lucide-react";
import { Link } from "react-router";
import { formatMoney } from "~/core/lib/format";
import { Badge, type BadgeVariant } from "~/core/ui/Badge";
import { EmptyState } from "~/core/ui/EmptyState";
import { SectionCard } from "~/core/ui/SectionCard";
import type { AdmissionDetail, AdmissionStatus } from "../model/admission.types";
import { formatDateTime, STATUS_LABEL } from "./admission-labels";
import { DischargeForm } from "./DischargeForm";
import { NoteForm } from "./NoteForm";

const STATUS_VARIANT: Record<AdmissionStatus, BadgeVariant> = { internado: "warning", alta: "success", fallecido: "neutral" };

function Info({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</dt>
            <dd className="mt-0.5 text-sm">{children || <span className="text-ink-muted">—</span>}</dd>
        </div>
    );
}

export function AdmissionDetailView({ admission: a }: { admission: AdmissionDetail }) {
    const active = a.status === "internado";

    return (
        <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
            <Link to="/internamiento" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-ink-muted hover:text-brand-text">
                <ArrowLeft aria-hidden className="size-4" />
                Volver al tablero
            </Link>

            <header className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight">{a.patient.name}</h1>
                <Badge variant={STATUS_VARIANT[a.status]} dot pulse={active}>{STATUS_LABEL[a.status]}</Badge>
                <Badge variant="brand">{a.kennel.name} · {a.kennel.code}</Badge>
            </header>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="flex min-w-0 flex-col gap-6">
                    <SectionCard title="Datos del internamiento" icon={BedDouble}>
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <Info label="Paciente">{a.patient.species}{a.patient.breed ? ` · ${a.patient.breed}` : ""}</Info>
                            <Info label="Propietario">{a.ownerName}{a.ownerPhone ? ` · ${a.ownerPhone}` : ""}</Info>
                            <Info label="Veterinario responsable">{a.vetName}</Info>
                            <Info label="Ingreso">{formatDateTime(a.admittedAt)}</Info>
                            <Info label="Motivo">{a.reason}</Info>
                            <Info label="Diagnóstico">{a.diagnosis}</Info>
                            <Info label={active ? "Costo estimado" : "Costo final"}>
                                {formatMoney(a.dailyRate * a.day)} · {a.day} día(s) × {formatMoney(a.dailyRate)}
                            </Info>
                            {a.dischargedAt && <Info label="Cierre">{formatDateTime(a.dischargedAt)}</Info>}
                            {a.dischargeNotes && <Info label="Indicaciones de alta">{a.dischargeNotes}</Info>}
                        </dl>
                    </SectionCard>

                    <SectionCard title="Evolución diaria" icon={HeartPulse}>
                        {a.notes.length === 0 ? (
                            <EmptyState icon={ClipboardList} title="Aún no hay notas" description="Registra la primera nota de evolución." />
                        ) : (
                            <ol className="flex flex-col gap-4">
                                {a.notes.map((note) => (
                                    <li key={note.id} className="rounded-xl border border-line bg-bg p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
                                            <span className="font-semibold text-ink">{note.authorName ?? "Personal clínico"}</span>
                                            <time dateTime={note.createdAt}>{formatDateTime(note.createdAt)}</time>
                                        </div>
                                        <p className="mt-2 text-sm whitespace-pre-line">{note.note}</p>
                                        {(note.weightKg !== null || note.temperatureC !== null) && (
                                            <p className="mt-3 flex flex-wrap gap-4 text-xs text-ink-muted">
                                                {note.weightKg !== null && <span className="inline-flex items-center gap-1"><Weight aria-hidden className="size-3.5" />{note.weightKg} kg</span>}
                                                {note.temperatureC !== null && <span className="inline-flex items-center gap-1"><Thermometer aria-hidden className="size-3.5" />{note.temperatureC} °C</span>}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        )}
                    </SectionCard>
                </div>

                {active && (
                    <aside className="flex flex-col gap-6">
                        <SectionCard title="Nueva nota" icon={ClipboardList}>
                            <NoteForm admissionId={a.id} />
                        </SectionCard>
                        <SectionCard title="Cerrar internamiento" icon={BedDouble}>
                            <DischargeForm admissionId={a.id} />
                        </SectionCard>
                    </aside>
                )}
            </div>
        </section>
    );
}