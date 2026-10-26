import { BedDouble, CalendarClock, ClipboardList, Plus, Stethoscope } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "~/core/ui/Badge";
import type { KennelCard } from "../model/admission.types";
import { formatDateTime, KIND_LABEL } from "./admission-labels";

interface KennelBoardProps {
    kennels: KennelCard[];
    clinical: boolean;
    onAdmit: (kennel: KennelCard) => void;
}

export function KennelBoard({ kennels, clinical, onAdmit }: KennelBoardProps) {
    return (
        <ul aria-label="Tablero de jaulas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {kennels.map((kennel) => {
                const occupant = kennel.occupant;
                return (
                    <li key={kennel.id} className="ui-card flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
                        <header className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
                                    <BedDouble aria-hidden className="size-5" />
                                </span>
                                <div>
                                    <h3 className="font-bold">{kennel.name}</h3>
                                    <p className="text-xs text-ink-muted">{kennel.code} · {KIND_LABEL[kennel.kind]}</p>
                                </div>
                            </div>
                            <Badge variant={occupant ? "warning" : "success"} dot pulse={Boolean(occupant)}>
                                {occupant ? "Ocupada" : "Disponible"}
                            </Badge>
                        </header>

                        {occupant ? (
                            <div className="flex flex-1 flex-col gap-2 text-sm">
                                <p className="text-lg font-extrabold">{occupant.patientName}</p>
                                <p className="flex items-center gap-2 text-ink-muted">
                                    <CalendarClock aria-hidden className="size-4 shrink-0" />
                                    Día {occupant.day} · desde {formatDateTime(occupant.admittedAt)}
                                </p>
                                {occupant.reason && (
                                    <p className="flex items-start gap-2 text-ink-muted">
                                        <ClipboardList aria-hidden className="mt-0.5 size-4 shrink-0" />
                                        <span className="line-clamp-2">{occupant.reason}</span>
                                    </p>
                                )}
                                {occupant.vetName && (
                                    <p className="flex items-center gap-2 text-ink-muted">
                                        <Stethoscope aria-hidden className="size-4 shrink-0" />
                                        {occupant.vetName}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="flex-1 text-sm text-ink-muted">Lista para recibir un nuevo paciente.</p>
                        )}

                        {clinical && occupant && (
                            <Link to={`/internamiento/${occupant.admissionId}`} className="ui-button inline-flex h-10 items-center justify-center rounded-xl border border-line text-sm font-semibold hover:border-brand hover:text-brand-text">
                                Ver evolución
                            </Link>
                        )}
                        {clinical && !occupant && (
                            <button type="button" onClick={() => onAdmit(kennel)} className="ui-button inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-on-brand">
                                <Plus aria-hidden className="size-4" />
                                Internar paciente
                            </button>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}