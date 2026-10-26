import { Flower2, Power, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Form, useActionData } from "react-router";
import { ConfirmForm } from "~/core/feedback/ConfirmForm";
import { Modal } from "~/core/ui/Modal";

interface Props { isActive: boolean; lifeStatus: string; isAdmin: boolean }
const btn = "ui-button inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-surface-muted";

export function PatientStatusPanel({ isActive, lifeStatus, isAdmin }: Props) {
    const result = useActionData() as { ok?: boolean; intent?: string } | undefined;
    const [open, setOpen] = useState(false);
    const dead = lifeStatus === "fallecido";
    const today = new Date().toISOString().slice(0, 10);

    useEffect(() => { if (result?.ok && result.intent === "mark-deceased") setOpen(false); }, [result]);

    return (
        <div className="flex flex-col gap-3">
            {!dead && (
                <ConfirmForm method="post" confirm={isActive
                    ? { tone: "danger", title: "¿Desactivar este paciente?", description: "Se conserva todo su historial clínico.", confirmLabel: "Desactivar" }
                    : { title: "¿Reactivar este paciente?", description: "Volverá a estar disponible para atención.", confirmLabel: "Reactivar" }}>
                    <input type="hidden" name="intent" value="toggle-active" />
                    <button type="submit" className={btn}><Power className="size-4" aria-hidden />{isActive ? "Desactivar paciente" : "Reactivar paciente"}</button>
                </ConfirmForm>
            )}
            {!dead && <button type="button" onClick={() => setOpen(true)} className={btn}><Flower2 className="size-4" aria-hidden />Registrar fallecimiento</button>}
            {dead && isAdmin && (
                <ConfirmForm method="post" confirm={{ title: "¿Revertir fallecimiento?", description: "El paciente volverá a figurar como vivo y activo.", confirmLabel: "Revertir" }}>
                    <input type="hidden" name="intent" value="revert-deceased" />
                    <button type="submit" className={btn}><RotateCcw className="size-4" aria-hidden />Revertir estado</button>
                </ConfirmForm>
            )}
            {dead && !isAdmin && <p className="text-sm text-ink-muted">Solo administración puede revertir este estado.</p>}

            <Modal open={open} onClose={() => setOpen(false)} title="Registrar fallecimiento">
                <Form method="post" className="flex flex-col gap-4">
                    <input type="hidden" name="intent" value="mark-deceased" />
                    <label className="flex flex-col gap-1.5 text-sm font-semibold">Fecha
                        <input type="date" name="deceasedAt" required max={today} defaultValue={today} className="ui-field h-11 rounded-xl border border-line bg-surface px-3 text-sm font-normal" />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold">Detalle (opcional)
                        <textarea name="deceasedNotes" rows={3} maxLength={500} className="ui-field rounded-xl border border-line bg-surface p-3 text-sm font-normal" />
                    </label>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setOpen(false)} className="ui-button h-11 rounded-xl border border-line px-5 text-sm font-semibold">Cancelar</button>
                        <button type="submit" className="ui-button h-11 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand">Confirmar</button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}