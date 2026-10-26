import { Play, SquareCheckBig, Ban } from "lucide-react";
import { Form, useNavigation } from "react-router";
import { ConfirmForm } from "~/core/feedback/ConfirmForm";
import type { SurgeryDetail } from "../model/surgery.types";

function Hidden({ intent, id }: { intent: string; id: string }) {
    return (
        <>
            <input type="hidden" name="intent" value={intent} />
            <input type="hidden" name="surgeryId" value={id} />
        </>
    );
}

export function WorkflowActions({ surgery }: { surgery: SurgeryDetail }) {
    const submitting = useNavigation().state === "submitting";

    if (surgery.status === "completada" || surgery.status === "cancelada") {
        return <p className="text-sm text-ink-muted">Esta cirugía está cerrada. Aún puedes ajustar las indicaciones postoperatorias.</p>;
    }

    if (surgery.status === "en_curso") {
        return (
            <ConfirmForm
                method="post"
                confirm={{
                    tone: "default",
                    title: "¿Marcar la cirugía como completada?",
                    description: "Se registrará la hora de finalización. Verifica que las notas del procedimiento estén guardadas.",
                    confirmLabel: "Completar cirugía",
                }}
            >
                <Hidden intent="complete" id={surgery.id} />
                <button type="submit" disabled={submitting} className="ui-button inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-on-brand disabled:opacity-60">
                    <SquareCheckBig aria-hidden className="size-4" />
                    Completar cirugía
                </button>
            </ConfirmForm>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <Form method="post">
                <Hidden intent="start" id={surgery.id} />
                <button type="submit" disabled={submitting || !surgery.consentSigned} className="ui-button inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-on-brand disabled:cursor-not-allowed disabled:opacity-50">
                    <Play aria-hidden className="size-4" />
                    Iniciar cirugía
                </button>
                {!surgery.consentSigned && <p className="mt-2 text-xs text-tone-red-fg">Guarda el consentimiento firmado para poder iniciar.</p>}
            </Form>
            <ConfirmForm
                method="post"
                confirm={{
                    tone: "danger",
                    title: "¿Cancelar esta cirugía?",
                    description: "La cirugía quedará como cancelada y no podrá reactivarse.",
                    confirmLabel: "Cancelar cirugía",
                }}
            >
                <Hidden intent="cancel" id={surgery.id} />
                <button type="submit" disabled={submitting} className="ui-button inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-tone-red-fg/40 text-sm font-semibold text-tone-red-fg hover:bg-tone-red-soft disabled:opacity-60">
                    <Ban aria-hidden className="size-4" />
                    Cancelar cirugía
                </button>
            </ConfirmForm>
        </div>
    );
}