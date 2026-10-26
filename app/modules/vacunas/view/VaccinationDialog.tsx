import { Pencil, Syringe } from "lucide-react";
import { useEffect, useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import { Modal } from "~/core/ui/Modal";
import type { VaccinationRow, VaccinePatientOption, VaccineOption, VacunaActionResult } from "../model/vacuna.types";
import { addDays, limaToday } from "../model/vacuna-dates";

interface Props { mode: "create" | "edit"; row?: VaccinationRow; patients: VaccinePatientOption[]; vaccines: VaccineOption[] }
const FIELD = "ui-field h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm font-normal";
const LABEL = "flex flex-col gap-1.5 text-sm font-semibold";

export function VaccinationDialog({ mode, row, patients, vaccines }: Props) {
    const result = useActionData() as VacunaActionResult | undefined;
    const busy = useNavigation().state !== "idle";
    const edit = mode === "edit";
    const [open, setOpen] = useState(false);
    const [vaccineId, setVaccineId] = useState("");
    const [appliedAt, setAppliedAt] = useState(row?.appliedAt ?? "");
    const [dueDate, setDueDate] = useState(row?.dueDate ?? "");

    useEffect(() => { if (result?.ok) setOpen(false); }, [result]);

    // Próxima dosis automática según el intervalo de la vacuna elegida
    useEffect(() => {
        if (edit) return;
        const interval = vaccines.find((v) => String(v.id) === vaccineId)?.intervalDays;
        if (interval) setDueDate(addDays(appliedAt || limaToday(), interval));
    }, [edit, vaccineId, appliedAt, vaccines]);

    const err = (k: string) => (result && !result.ok && result.intent === mode ? result.fieldErrors?.[k]?.[0] : undefined);
    const Err = ({ k }: { k: string }) => (err(k) ? <span className="text-xs font-normal text-tone-orange-fg">{err(k)}</span> : null);

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className={edit
                ? "ui-button inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold hover:border-brand hover:text-brand-text"
                : "ui-button inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-on-brand shadow-md shadow-brand/30 hover:opacity-90"}>
                {edit ? <Pencil className="size-3.5" aria-hidden /> : <Syringe className="size-5" aria-hidden />}
                {edit ? "Editar" : "Registrar vacuna"}
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title={edit ? `Editar: ${row?.vaccineName} · ${row?.patientName}` : "Registrar vacuna"}>
                {open && (
                    <Form method="post" className="grid gap-4 sm:grid-cols-2">
                        <input type="hidden" name="intent" value={mode} />
                        {edit && <input type="hidden" name="recordId" value={row?.id} />}
                        {!edit && (
                            <>
                                <label className={LABEL}>Paciente *
                                    <select name="patientId" required defaultValue="" className={FIELD}>
                                        <option value="">Selecciona un paciente</option>
                                        {patients.map((p) => <option key={p.id} value={p.id}>{p.name}{p.ownerName ? ` — ${p.ownerName}` : ""}</option>)}
                                    </select>
                                    <Err k="patientId" />
                                </label>
                                <label className={LABEL}>Vacuna *
                                    <select name="vaccineId" required value={vaccineId} onChange={(e) => setVaccineId(e.target.value)} className={FIELD}>
                                        <option value="">Selecciona la vacuna</option>
                                        {vaccines.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                    <Err k="vaccineId" />
                                </label>
                            </>
                        )}
                        <label className={LABEL}>Fecha de aplicación
                            <input name="appliedAt" type="date" max={limaToday()} value={appliedAt} onChange={(e) => setAppliedAt(e.target.value)} className={FIELD} />
                            <span className="text-xs font-normal text-ink-muted">Déjala vacía para programar una dosis pendiente.</span>
                            <Err k="appliedAt" />
                        </label>
                        <label className={LABEL}>Próxima dosis *
                            <input name="dueDate" type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={FIELD} />
                            <Err k="dueDate" />
                        </label>
                        <label className={LABEL}>Lote<input name="lot" maxLength={40} defaultValue={row?.lot ?? ""} className={FIELD} /><Err k="lot" /></label>
                        <label className={`${LABEL} sm:col-span-2`}>Notas
                            <textarea name="notes" rows={2} maxLength={500} defaultValue={row?.notes ?? ""} className="ui-field w-full rounded-xl border border-line bg-bg p-3 text-sm font-normal" />
                        </label>
                        <div className="mt-2 flex justify-end gap-3 sm:col-span-2">
                            <button type="button" onClick={() => setOpen(false)} className="ui-button h-11 rounded-xl border border-line px-5 text-sm font-semibold hover:bg-surface-muted">Cancelar</button>
                            <button type="submit" disabled={busy} className="ui-button h-11 rounded-xl bg-brand px-6 text-sm font-bold text-on-brand disabled:opacity-60">{busy ? "Guardando…" : "Guardar"}</button>
                        </div>
                    </Form>
                )}
            </Modal>
        </>
    );
}