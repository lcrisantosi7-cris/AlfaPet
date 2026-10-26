import { CalendarPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { useActionToast } from "~/core/feedback/use-action-toast";
import { Modal } from "~/core/ui/Modal";
import type { CirugiasResult, SurgeonOption, SurgeryPatientOption, SurgeryServiceOption } from "../model/surgery.types";

interface ScheduleDialogProps {
    patients: SurgeryPatientOption[];
    procedures: SurgeryServiceOption[];
    surgeons: SurgeonOption[];
    isAdmin: boolean;
    nowLocal: string;
}

const CONTROL = "ui-field h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm";
const LABEL = "flex flex-col gap-1.5 text-sm font-semibold";

export function ScheduleDialog({ patients, procedures, surgeons, isAdmin, nowLocal }: ScheduleDialogProps) {
    const fetcher = useFetcher<CirugiasResult>();
    const [open, setOpen] = useState(false);
    const [price, setPrice] = useState("0");
    const handled = useRef<unknown>(null);
    useActionToast(fetcher.data);

    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data?.ok && handled.current !== fetcher.data) {
            handled.current = fetcher.data;
            setOpen(false);
        }
    }, [fetcher.state, fetcher.data]);

    const submitting = fetcher.state !== "idle";

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className="ui-button inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand">
                <CalendarPlus aria-hidden className="size-5" />
                Programar cirugía
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title="Programar cirugía">
                <fetcher.Form method="post" action="/cirugias" className="grid gap-4 sm:grid-cols-2">
                    <label className={`${LABEL} sm:col-span-2`}>
                        Paciente *
                        <select name="patientId" required defaultValue="" className={CONTROL}>
                            <option value="">Seleccionar paciente</option>
                            {patients.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} · {p.species}{p.ownerName ? ` · ${p.ownerName}` : ""}</option>
                            ))}
                        </select>
                    </label>

                    <label className={LABEL}>
                        Procedimiento *
                        <select
                            name="serviceId"
                            required
                            defaultValue=""
                            onChange={(event) => {
                                const selected = procedures.find((p) => String(p.id) === event.target.value);
                                if (selected) setPrice(String(selected.price));
                            }}
                            className={CONTROL}
                        >
                            <option value="">Seleccionar procedimiento</option>
                            {procedures.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </label>

                    <label className={LABEL}>
                        Precio (S/) *
                        <input name="price" type="number" min="0" step="0.01" required value={price} onChange={(event) => setPrice(event.target.value)} className={CONTROL} />
                    </label>

                    <label className={LABEL}>
                        Fecha y hora *
                        <input name="scheduledAt" type="datetime-local" required min={nowLocal} className={CONTROL} />
                    </label>

                    {isAdmin && (
                        <label className={LABEL}>
                            Cirujano responsable *
                            <select name="surgeonId" required defaultValue="" className={CONTROL}>
                                <option value="">Seleccionar cirujano</option>
                                {surgeons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </label>
                    )}

                    <label className={`${LABEL} sm:col-span-2`}>
                        Notas preoperatorias
                        <textarea name="preOpNotes" maxLength={2000} rows={3} className="ui-field w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm" />
                    </label>

                    <div className="flex justify-end gap-3 sm:col-span-2">
                        <button type="button" onClick={() => setOpen(false)} className="ui-button h-11 rounded-xl border border-line px-5 text-sm font-semibold">Cancelar</button>
                        <button type="submit" disabled={submitting} className="ui-button h-11 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand disabled:opacity-60">
                            {submitting ? "Guardando…" : "Programar"}
                        </button>
                    </div>
                </fetcher.Form>
            </Modal>
        </>
    );
}