import { ArrowLeft, ClipboardList, Pencil, Stethoscope, Thermometer } from "lucide-react";
import { useEffect } from "react";
import { Form, Link, useActionData, useNavigation, useSearchParams } from "react-router";
import { useActionToast } from "~/core/feedback/use-action-toast";
import { SectionCard } from "~/core/ui/SectionCard";
import type { ConsultaActionResult, ConsultaDetail } from "../model/consulta.types";
import { fmtDateTime } from "./ConsultasView";

function Info({ label, children }: { label: string; children?: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</dt>
            <dd className="mt-0.5 whitespace-pre-line text-sm">{children || <span className="text-ink-muted">—</span>}</dd>
        </div>
    );
}
const AREA = "ui-field w-full rounded-xl border border-line bg-bg p-3 text-sm";
const FIELD = "ui-field h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm";

export function ConsultaDetailView({ consulta: c }: { consulta: ConsultaDetail }) {
    const result = useActionData() as ConsultaActionResult | undefined;
    useActionToast(result);
    const busy = useNavigation().state !== "idle";
    const [params, setParams] = useSearchParams();
    const editing = params.get("editar") === "1";
    const err = (k: string) => result?.fieldErrors?.[k]?.[0];

    useEffect(() => { if (result?.ok && result.intent === "update") setParams({}, { replace: true }); }, [result, setParams]);

    return (
        <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
            <Link to="/consultas" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-ink-muted hover:text-brand-text"><ArrowLeft aria-hidden className="size-4" />Volver a consultas</Link>

            <header className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight">{c.patientName}</h1>
                <span className="text-ink-muted">Consulta del {fmtDateTime(c.createdAt)}</span>
                {!editing && <Link to="?editar=1" className="ui-button ml-auto inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:border-brand hover:text-brand-text"><Pencil className="size-4" aria-hidden />Editar</Link>}
            </header>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="flex min-w-0 flex-col gap-6">
                    {editing ? (
                        <SectionCard title="Editar consulta" icon={Pencil}>
                            <Form method="post" className="grid gap-4 sm:grid-cols-2">
                                <label className="flex flex-col gap-1.5 text-sm font-semibold">Peso (kg)<input name="weightKg" type="number" step="0.01" min="0.01" defaultValue={c.weightKg ?? ""} className={FIELD} />{err("weightKg") && <span className="text-xs font-normal text-tone-orange-fg">{err("weightKg")}</span>}</label>
                                <label className="flex flex-col gap-1.5 text-sm font-semibold">Temperatura (°C)<input name="temperatureC" type="number" step="0.1" min="30" max="45" defaultValue={c.temperatureC ?? ""} className={FIELD} />{err("temperatureC") && <span className="text-xs font-normal text-tone-orange-fg">{err("temperatureC")}</span>}</label>
                                <label className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">Síntomas<textarea name="symptoms" rows={3} maxLength={2000} defaultValue={c.symptoms ?? ""} className={AREA} /></label>
                                <label className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">Diagnóstico *<textarea name="diagnosis" rows={3} required maxLength={2000} defaultValue={c.diagnosis ?? ""} className={AREA} />{err("diagnosis") && <span className="text-xs font-normal text-tone-orange-fg">{err("diagnosis")}</span>}</label>
                                <label className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">Tratamiento<textarea name="treatment" rows={3} maxLength={2000} defaultValue={c.treatment ?? ""} className={AREA} /></label>
                                <label className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">Notas<textarea name="notes" rows={3} maxLength={2000} defaultValue={c.notes ?? ""} className={AREA} /></label>
                                <div className="flex justify-end gap-3 sm:col-span-2">
                                    <Link to="?" className="ui-button inline-flex h-11 items-center rounded-xl border border-line px-5 text-sm font-semibold hover:bg-surface-muted">Cancelar</Link>
                                    <button type="submit" disabled={busy} className="ui-button h-11 rounded-xl bg-brand px-6 text-sm font-bold text-on-brand disabled:opacity-60">{busy ? "Guardando…" : "Guardar cambios"}</button>
                                </div>
                            </Form>
                        </SectionCard>
                    ) : (
                        <SectionCard title="Registro clínico" icon={ClipboardList}>
                            <dl className="grid gap-5">
                                <Info label="Síntomas">{c.symptoms}</Info>
                                <Info label="Diagnóstico">{c.diagnosis}</Info>
                                <Info label="Tratamiento">{c.treatment}</Info>
                                <Info label="Notas">{c.notes}</Info>
                            </dl>
                        </SectionCard>
                    )}
                </div>

                <aside className="flex flex-col gap-6">
                    <SectionCard title="Datos de la consulta" icon={Stethoscope}>
                        <dl className="grid gap-4">
                            <Info label="Paciente"><Link to={`/pacientes/${c.patientId}`} className="font-semibold text-brand-text hover:underline">{c.patientName}</Link>{c.breed ? ` · ${c.breed}` : ""}</Info>
                            <Info label="Dueño">{c.ownerName}{c.ownerPhone ? ` · ${c.ownerPhone}` : ""}</Info>
                            <Info label="Veterinario">{c.vetName}</Info>
                            <Info label="Cita relacionada">{c.appointmentLabel ?? "Sin cita"}</Info>
                            <Info label="Registrada">{fmtDateTime(c.createdAt)}</Info>
                        </dl>
                    </SectionCard>
                    <SectionCard title="Signos" icon={Thermometer}>
                        <dl className="grid grid-cols-2 gap-4">
                            <Info label="Peso en consulta">{c.weightKg ? `${c.weightKg} kg` : null}</Info>
                            <Info label="Temperatura">{c.temperatureC ? `${c.temperatureC} °C` : null}</Info>
                            <Info label="Peso actual del paciente">{c.currentWeightKg ? `${c.currentWeightKg} kg` : null}</Info>
                        </dl>
                    </SectionCard>
                </aside>
            </div>
        </section>
    );
}