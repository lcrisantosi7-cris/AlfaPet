import { FlaskConical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { useActionToast } from "~/core/feedback/use-action-toast";
import { formatMoney } from "~/core/lib/format";
import { Modal } from "~/core/ui/Modal";
import type { AnalisisResult, LabAnalysisOption, LabPatientOption } from "../model/lab.types";

interface NewOrderDialogProps {
    patients: LabPatientOption[];
    analyses: LabAnalysisOption[];
}

const CONTROL = "ui-field w-full rounded-xl border border-line bg-bg px-3 text-sm";

export function NewOrderDialog({ patients, analyses }: NewOrderDialogProps) {
    const fetcher = useFetcher<AnalisisResult>();
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
    const handled = useRef<unknown>(null);
    useActionToast(fetcher.data);

    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data?.ok && handled.current !== fetcher.data) {
            handled.current = fetcher.data;
            setOpen(false);
            setSelected(new Set());
        }
    }, [fetcher.state, fetcher.data]);

    const toggle = (id: number) =>
        setSelected((current) => {
            const next = new Set(current);
            if (!next.delete(id)) next.add(id);
            return next;
        });

    const total = analyses.filter((a) => selected.has(a.id)).reduce((sum, a) => sum + a.price, 0);
    const submitting = fetcher.state !== "idle";

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className="ui-button inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand">
                <FlaskConical aria-hidden className="size-5" />
                Nueva orden
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title="Nueva orden de análisis">
                <fetcher.Form method="post" action="/analisis" className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5 text-sm font-semibold">
                        Paciente *
                        <select name="patientId" required defaultValue="" className={`${CONTROL} h-11`}>
                            <option value="">Seleccionar paciente</option>
                            {patients.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} · {p.species}{p.ownerName ? ` · ${p.ownerName}` : ""}</option>
                            ))}
                        </select>
                    </label>

                    <fieldset>
                        <legend className="mb-2 text-sm font-semibold">Análisis a realizar *</legend>
                        {analyses.length === 0 ? (
                            <p className="rounded-xl border border-line bg-bg p-4 text-sm text-ink-muted">No hay análisis activos en el catálogo de servicios.</p>
                        ) : (
                            <ul className="grid gap-2 sm:grid-cols-2">
                                {analyses.map((a) => (
                                    <li key={a.id}>
                                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-bg p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                                            <input type="checkbox" name="serviceIds" value={a.id} checked={selected.has(a.id)} onChange={() => toggle(a.id)} className="mt-1 size-4 accent-[var(--color-brand)]" />
                                            <span className="text-sm">
                                                <span className="font-semibold">{a.name}</span>
                                                <span className="block text-xs text-ink-muted">{a.sampleType ?? "Muestra"} · {formatMoney(a.price)}</span>
                                            </span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </fieldset>

                    <label className="flex flex-col gap-1.5 text-sm font-semibold">
                        Notas clínicas
                        <textarea name="notes" maxLength={1000} rows={2} placeholder="Sospecha diagnóstica, ayuno, urgencia…" className={`${CONTROL} py-2`} />
                    </label>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                        <p className="text-sm text-ink-muted">{selected.size} análisis · <strong className="text-ink">{formatMoney(total)}</strong></p>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setOpen(false)} className="ui-button h-11 rounded-xl border border-line px-5 text-sm font-semibold">Cancelar</button>
                            <button type="submit" disabled={submitting || selected.size === 0} className="ui-button h-11 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand disabled:opacity-60">
                                {submitting ? "Creando…" : "Crear orden"}
                            </button>
                        </div>
                    </div>
                </fetcher.Form>
            </Modal>
        </>
    );
}