import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { useActionToast } from "~/core/feedback/use-action-toast";
import { Modal } from "~/core/ui/Modal";
import type { AppointmentOption, ConsultaActionResult, PatientOption } from "../model/consulta.types";

const FIELD = "ui-field h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm font-normal";
const AREA = "ui-field w-full rounded-xl border border-line bg-bg p-3 text-sm font-normal";
const LABEL = "flex flex-col gap-1.5 text-sm font-semibold";

export function NewConsultaDialog({ patients, appointments }: { patients: PatientOption[]; appointments: AppointmentOption[] }) {
    const fetcher = useFetcher<ConsultaActionResult>();
    useActionToast(fetcher.data);
    const [open, setOpen] = useState(false);
    const [patientId, setPatientId] = useState("");
    const [formKey, setFormKey] = useState(0);

    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data?.ok) { setOpen(false); setPatientId(""); setFormKey((k) => k + 1); }
    }, [fetcher.state, fetcher.data]);

    const patient = patients.find((p) => p.id === patientId);
    const appts = appointments.filter((a) => a.patientId === patientId);
    const err = (k: string) => (fetcher.data && !fetcher.data.ok ? fetcher.data.fieldErrors?.[k]?.[0] : undefined);
    const Err = ({ k }: { k: string }) => (err(k) ? <span className="text-xs font-normal text-tone-orange-fg">{err(k)}</span> : null);

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className="ui-button inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-on-brand shadow-md shadow-brand/30 hover:opacity-90">
                <Plus className="size-5" aria-hidden />Registrar consulta
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title="Registrar consulta clínica">
                <fetcher.Form key={formKey} method="post" action="/consultas" className="flex flex-col gap-5">
                    <fieldset className="ui-form-section grid gap-4 sm:grid-cols-2">
                        <legend className="px-2 text-sm font-bold">Paciente y cita</legend>
                        <label className={LABEL}>Paciente *
                            <select name="patientId" required value={patientId} onChange={(e) => setPatientId(e.target.value)} className={FIELD}>
                                <option value="">Selecciona un paciente</option>
                                {patients.map((p) => <option key={p.id} value={p.id}>{p.name}{p.ownerName ? ` — ${p.ownerName}` : ""}</option>)}
                            </select>
                            <Err k="patientId" />
                        </label>
                        <label className={LABEL}>Cita relacionada
                            <select name="appointmentId" disabled={!patientId} className={FIELD} defaultValue="">
                                <option value="">{!patientId ? "Elige primero un paciente" : appts.length ? "Sin cita (atención directa)" : "Sin citas pendientes vigentes"}</option>
                                {appts.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                            </select>
                            <Err k="appointmentId" />
                        </label>
                    </fieldset>

                    <fieldset className="ui-form-section grid gap-4 sm:grid-cols-2">
                        <legend className="px-2 text-sm font-bold">Signos</legend>
                        <label className={LABEL}>Peso actual (kg)
                            <input name="weightKg" type="number" step="0.01" min="0.01" className={FIELD} />
                            <span className="text-xs font-normal text-ink-muted">{patient?.currentWeightKg ? `Último peso: ${patient.currentWeightKg} kg. ` : ""}Al guardar se actualiza el peso del paciente.</span>
                            <Err k="weightKg" />
                        </label>
                        <label className={LABEL}>Temperatura (°C)
                            <input name="temperatureC" type="number" step="0.1" min="30" max="45" className={FIELD} />
                            <Err k="temperatureC" />
                        </label>
                    </fieldset>

                    <fieldset className="ui-form-section grid gap-4">
                        <legend className="px-2 text-sm font-bold">Evaluación clínica</legend>
                        <label className={LABEL}>Síntomas<textarea name="symptoms" rows={2} maxLength={2000} className={AREA} /><Err k="symptoms" /></label>
                        <label className={LABEL}>Diagnóstico *<textarea name="diagnosis" rows={2} required maxLength={2000} className={AREA} /><Err k="diagnosis" /></label>
                        <label className={LABEL}>Tratamiento<textarea name="treatment" rows={2} maxLength={2000} className={AREA} /><Err k="treatment" /></label>
                        <label className={LABEL}>Notas<textarea name="notes" rows={2} maxLength={2000} className={AREA} /><Err k="notes" /></label>
                    </fieldset>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setOpen(false)} className="ui-button h-11 rounded-xl border border-line px-5 text-sm font-semibold hover:bg-surface-muted">Cancelar</button>
                        <button type="submit" disabled={fetcher.state !== "idle"} className="ui-button h-11 rounded-xl bg-brand px-6 text-sm font-bold text-on-brand disabled:opacity-60">{fetcher.state !== "idle" ? "Guardando…" : "Guardar consulta"}</button>
                    </div>
                </fetcher.Form>
            </Modal>
        </>
    );
}