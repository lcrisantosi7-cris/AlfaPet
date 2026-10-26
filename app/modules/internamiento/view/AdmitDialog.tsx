import { useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import { useActionToast } from "~/core/feedback/use-action-toast";
import { Modal } from "~/core/ui/Modal";
import type { AdmissiblePatient, InternamientoResult, KennelCard, VetOption } from "../model/admission.types";

interface AdmitDialogProps {
    kennel: KennelCard | null;
    patients: AdmissiblePatient[];
    vets: VetOption[];
    defaultRate: number;
    isAdmin: boolean;
    onClose: () => void;
}

const CONTROL = "ui-field w-full rounded-xl border border-line bg-bg px-3 text-sm";
const LABEL = "flex flex-col gap-1.5 text-sm font-semibold";

export function AdmitDialog({ kennel, patients, vets, defaultRate, isAdmin, onClose }: AdmitDialogProps) {
    const fetcher = useFetcher<InternamientoResult>();
    const handled = useRef<unknown>(null);
    useActionToast(fetcher.data);

    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data?.ok && handled.current !== fetcher.data) {
            handled.current = fetcher.data;
            onClose();
        }
    }, [fetcher.state, fetcher.data, onClose]);

    const submitting = fetcher.state !== "idle";

    return (
        <Modal open={kennel !== null} onClose={onClose} title={kennel ? `Internar en ${kennel.name}` : "Internar paciente"}>
            {kennel && (
                <fetcher.Form key={kennel.id} method="post" action="/internamiento" className="grid gap-4 sm:grid-cols-2">
                    <input type="hidden" name="kennelId" value={kennel.id} />

                    <label className={`${LABEL} sm:col-span-2`}>
                        Paciente *
                        <select name="patientId" required defaultValue="" className={`${CONTROL} h-11`}>
                            <option value="">Seleccionar paciente</option>
                            {patients.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} · {p.species}{p.ownerName ? ` · ${p.ownerName}` : ""}</option>
                            ))}
                        </select>
                    </label>

                    {isAdmin && (
                        <label className={`${LABEL} sm:col-span-2`}>
                            Veterinario responsable *
                            <select name="vetId" required defaultValue="" className={`${CONTROL} h-11`}>
                                <option value="">Seleccionar veterinario</option>
                                {vets.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </label>
                    )}

                    <label className={`${LABEL} sm:col-span-2`}>
                        Motivo del internamiento *
                        <textarea name="reason" required maxLength={1000} rows={3} className={`${CONTROL} py-2`} />
                    </label>
                    <label className={`${LABEL} sm:col-span-2`}>
                        Diagnóstico presuntivo
                        <textarea name="diagnosis" maxLength={2000} rows={2} className={`${CONTROL} py-2`} />
                    </label>
                    <label className={LABEL}>
                        Tarifa por día (S/)
                        <input name="dailyRate" type="number" min="0" step="0.01" defaultValue={defaultRate} required className={`${CONTROL} h-11`} />
                    </label>

                    <div className="flex items-end justify-end gap-3 sm:col-span-2">
                        <button type="button" onClick={onClose} className="ui-button h-11 rounded-xl border border-line px-5 text-sm font-semibold">Cancelar</button>
                        <button type="submit" disabled={submitting} className="ui-button h-11 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand disabled:opacity-60">
                            {submitting ? "Guardando…" : "Confirmar internamiento"}
                        </button>
                    </div>
                </fetcher.Form>
            )}
        </Modal>
    );
}