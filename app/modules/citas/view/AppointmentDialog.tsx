import { CalendarPlus, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import { Modal } from "~/core/ui/Modal";

export interface AppointmentFormData {
    id: string; patientId?: string; careTypeId?: number | string; startsAt: string; vetId?: string | null; notes?: string | null;
}
interface Props {
    mode: "create" | "edit";
    appointment?: AppointmentFormData;
    patients: { id: string; name: string }[];
    careTypes: { id: number; label: string }[];
    vets: { id: string; full_name: string }[];
}

const localInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const FIELD = "ui-field h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm font-normal text-ink";
const LABEL = "flex flex-col gap-1.5 text-sm font-semibold";

export function AppointmentDialog({ mode, appointment: a, patients, careTypes, vets }: Props) {
    const result = useActionData() as { ok?: boolean } | undefined;
    const busy = useNavigation().state !== "idle";
    const [open, setOpen] = useState(false);
    const edit = mode === "edit";

    useEffect(() => { if (result?.ok) setOpen(false); }, [result]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={edit
                    ? "ui-button inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold hover:border-brand hover:text-brand-text"
                    : "ui-button inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-on-brand shadow-md shadow-brand/30 hover:opacity-90"}
            >
                {edit ? <Pencil className="size-3.5" aria-hidden /> : <CalendarPlus className="size-5" aria-hidden />}
                {edit ? "Reprogramar" : "Programar cita"}
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title={edit ? "Reprogramar cita" : "Programar nueva cita"}>
                {open && (
                    <Form method="post" className="grid gap-4 sm:grid-cols-2">
                        <input type="hidden" name="intent" value={edit ? "update" : "create"} />
                        {edit && <input type="hidden" name="record_id" value={a?.id} />}
                        <label className={`${LABEL} sm:col-span-2`}>Paciente *
                            <select name="patient_id" required defaultValue={a?.patientId ?? ""} className={FIELD}>
                                <option value="">Selecciona un paciente</option>
                                {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </label>
                        <label className={LABEL}>Tipo de atención *
                            <select name="care_type_id" required defaultValue={a?.careTypeId ?? ""} className={FIELD}>
                                <option value="">Selecciona la atención</option>
                                {careTypes.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </label>
                        <label className={LABEL}>Fecha y hora *
                            <input name="starts_at" type="datetime-local" required min={localInput(new Date())} defaultValue={edit && a ? localInput(new Date(a.startsAt)) : ""} className={FIELD} />
                        </label>
                        <label className={`${LABEL} sm:col-span-2`}>Veterinario
                            <select name="vet_id" defaultValue={a?.vetId ?? ""} className={FIELD}>
                                <option value="">Sin asignar</option>
                                {vets.map((v) => <option key={v.id} value={v.id}>{v.full_name}</option>)}
                            </select>
                        </label>
                        <label className={`${LABEL} sm:col-span-2`}>Notas
                            <textarea name="notes" rows={3} maxLength={1000} defaultValue={a?.notes ?? ""} className="ui-field w-full rounded-xl border border-line bg-bg p-3 text-sm font-normal text-ink" />
                        </label>
                        <div className="mt-2 flex justify-end gap-3 sm:col-span-2">
                            <button type="button" onClick={() => setOpen(false)} className="ui-button h-11 rounded-xl border border-line px-5 text-sm font-semibold hover:bg-surface-muted">Cancelar</button>
                            <button type="submit" disabled={busy} className="ui-button h-11 rounded-xl bg-brand px-6 text-sm font-bold text-on-brand disabled:opacity-60">{busy ? "Guardando…" : edit ? "Guardar cambios" : "Guardar cita"}</button>
                        </div>
                    </Form>
                )}
            </Modal>
        </>
    );
}