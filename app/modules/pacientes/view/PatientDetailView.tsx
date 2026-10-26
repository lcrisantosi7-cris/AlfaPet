import { ArrowLeft, PawPrint, Pencil, ShieldCheck, Stethoscope, Syringe, UserRound, Weight, Flower2 } from "lucide-react";
import { useEffect } from "react";
import { Link, useActionData, useSearchParams } from "react-router";
import { useActionToast } from "~/core/feedback/use-action-toast";
import { Badge } from "~/core/ui/Badge";
import { SectionCard } from "~/core/ui/SectionCard";
import type { OwnerOption, PatientDetailData } from "../model/patient.types";
import { NewPatientDialog } from "./NewPatientDialog";
import { PatientEditForm } from "./PatientEditForm";
import { PatientStatusPanel } from "./PatientStatusPanel";
import { ageLabel, dateLabel, patientState, speciesLabel, WEIGHT_SOURCE } from "./patient-labels";

function Info({ label, children }: { label: string; children?: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</dt>
            <dd className="mt-0.5 text-sm">{children || <span className="text-ink-muted">—</span>}</dd>
        </div>
    );
}

export function PatientDetailView({ patient: p, owner, otherPets, weights, consultations, vaccinations, options, canEdit, isAdmin }: PatientDetailData) {
    const result = useActionData() as { ok?: boolean; message?: string; intent?: string } | undefined;
    useActionToast(result);
    const [params, setParams] = useSearchParams();
    const editing = canEdit && params.get("editar") === "1";
    const state = patientState(p);
    const dead = p.lifeStatus === "fallecido";

    useEffect(() => {
        if (result?.ok && result.intent === "update") setParams({}, { replace: true });
    }, [result, setParams]);

    const ownerOption: OwnerOption = { id: owner.id, name: owner.name, phone: owner.phone ?? undefined, document: owner.document ?? undefined, petCount: otherPets.length + 1 };

    return (
        <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
            <Link to="/pacientes" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-ink-muted hover:text-brand-text">
                <ArrowLeft aria-hidden className="size-4" />Volver a pacientes
            </Link>

            <header className="flex flex-wrap items-center gap-3">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-text"><PawPrint className="size-7" /></span>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">{p.name}</h1>
                    <p className="text-sm text-ink-muted">{speciesLabel(p.species)}{p.breed ? ` · ${p.breed}` : ""} · {ageLabel(p.birthDate)}</p>
                </div>
                <Badge variant={state.variant} dot>{state.label}</Badge>
                {(isAdmin || !canEdit) && (
                    <Link to={`/historial-clinico/${p.id}`} className="ui-button ml-auto inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:border-brand hover:text-brand-text">Historial clínico</Link>
                )}
                {canEdit && !editing && (
                    <div className="flex flex-wrap gap-2">
                        <NewPatientDialog options={options} owners={[ownerOption]} presetOwnerId={owner.id} label="Agregar otra mascota" compact />
                        <Link to="?editar=1" className="ui-button inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:border-brand hover:text-brand-text">
                            <Pencil className="size-4" aria-hidden />Editar ficha
                        </Link>
                    </div>
                )}
            </header>

            {dead && (
                <div role="status" className="flex items-start gap-3 rounded-2xl border border-line bg-surface-muted p-4">
                    <Flower2 className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden />
                    <div className="text-sm">
                        <p className="font-bold">Paciente fallecido{p.deceasedAt ? ` el ${dateLabel(p.deceasedAt)}` : ""}</p>
                        {p.deceasedNotes && <p className="mt-1 text-ink-muted">{p.deceasedNotes}</p>}
                    </div>
                </div>
            )}

            {editing ? (
                <SectionCard title="Editar ficha" icon={Pencil}>
                    <PatientEditForm patient={p} owner={owner} options={options} petCount={otherPets.length + 1} />
                </SectionCard>
            ) : (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
                    <div className="flex min-w-0 flex-col gap-6">
                        <SectionCard title="Ficha del paciente" icon={PawPrint}>
                            <dl className="grid gap-4 sm:grid-cols-3">
                                <Info label="Especie">{speciesLabel(p.species)}</Info>
                                <Info label="Raza">{p.breed}</Info>
                                <Info label="Sexo">{p.sex ? speciesLabel(p.sex) : null}</Info>
                                <Info label="Nacimiento">{p.birthDate ? dateLabel(p.birthDate) : null}</Info>
                                <Info label="Color">{p.color}</Info>
                                <Info label="Microchip">{p.microchip}</Info>
                                <Info label="Esterilizado">{p.isSterilized === null ? null : p.isSterilized ? "Sí" : "No"}</Info>
                                <Info label="Alergias">{p.allergies}</Info>
                                <Info label="Registrado">{dateLabel(p.createdAt)}</Info>
                                <div className="sm:col-span-3"><Info label="Observaciones">{p.notes}</Info></div>
                            </dl>
                        </SectionCard>

                        <SectionCard title="Propietario" icon={UserRound}>
                            <dl className="grid gap-4 sm:grid-cols-2">
                                <Info label="Nombre">{owner.name}</Info>
                                <Info label="Teléfono">{owner.phone}</Info>
                                <Info label="DNI">{owner.document}</Info>
                                <Info label="Correo">{owner.email}</Info>
                                <div className="sm:col-span-2"><Info label="Dirección">{owner.address}</Info></div>
                            </dl>
                        </SectionCard>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <SectionCard title="Últimas consultas" icon={Stethoscope}>
                                {consultations.length === 0 ? <p className="text-sm text-ink-muted">Sin consultas registradas.</p> : (
                                    <ul className="divide-y divide-line">
                                        {consultations.map((c) => (
                                            <li key={c.id} className="py-2.5 text-sm">
                                                <p className="font-semibold">{dateLabel(c.date)}{c.vet ? ` · ${c.vet}` : ""}</p>
                                                <p className="line-clamp-2 text-ink-muted">{c.diagnosis || "Sin diagnóstico"}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </SectionCard>
                            <SectionCard title="Vacunas" icon={Syringe}>
                                {vaccinations.length === 0 ? <p className="text-sm text-ink-muted">Sin vacunas registradas.</p> : (
                                    <ul className="divide-y divide-line">
                                        {vaccinations.map((v) => (
                                            <li key={v.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                                                <span className="font-semibold">{v.vaccine}</span>
                                                {v.appliedAt ? <Badge variant="success">Aplicada {dateLabel(v.appliedAt)}</Badge> : <Badge variant="info">Vence {dateLabel(v.dueDate)}</Badge>}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </SectionCard>
                        </div>
                    </div>

                    <aside className="flex flex-col gap-6">
                        <SectionCard title="Peso" icon={Weight}>
                            <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="rounded-xl bg-brand-soft p-3"><p className="text-xs text-ink-muted">Actual</p><p className="text-2xl font-extrabold">{p.currentWeightKg ?? "—"}<span className="text-sm font-semibold"> kg</span></p></div>
                                <div className="rounded-xl bg-surface-muted p-3"><p className="text-xs text-ink-muted">Inicial</p><p className="text-2xl font-extrabold">{p.initialWeightKg ?? "—"}<span className="text-sm font-semibold"> kg</span></p></div>
                            </div>
                            {weights.length > 0 && (
                                <ul className="mt-4 divide-y divide-line text-sm">
                                    {weights.map((w) => (
                                        <li key={w.id} className="flex items-center justify-between py-2">
                                            <span><b>{w.weightKg} kg</b> <span className="text-xs text-ink-muted">· {WEIGHT_SOURCE[w.source] ?? w.source}</span></span>
                                            <span className="text-xs text-ink-muted">{dateLabel(w.recordedAt)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </SectionCard>

                        <SectionCard title={`Otras mascotas de ${owner.name.split(" ")[0]}`} icon={PawPrint}>
                            {otherPets.length === 0 ? <p className="text-sm text-ink-muted">Es la única mascota registrada.</p> : (
                                <ul className="flex flex-col gap-2">
                                    {otherPets.map((x) => {
                                        const s = patientState(x);
                                        return (
                                            <li key={x.id}>
                                                <Link to={`/pacientes/${x.id}`} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm hover:border-brand">
                                                    <span className="font-semibold">{x.name} <span className="text-xs font-normal text-ink-muted">{speciesLabel(x.species)}</span></span>
                                                    <Badge variant={s.variant}>{s.label}</Badge>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </SectionCard>

                        {canEdit && (
                            <SectionCard title="Estado del paciente" icon={ShieldCheck}>
                                <PatientStatusPanel isActive={p.isActive} lifeStatus={p.lifeStatus} isAdmin={isAdmin} />
                            </SectionCard>
                        )}
                    </aside>
                </div>
            )}
        </section>
    );
}