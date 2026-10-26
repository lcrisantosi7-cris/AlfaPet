import { Ban, CheckCheck, FlaskRound, TestTube } from "lucide-react";
import { Form, useNavigation } from "react-router";
import { ConfirmForm } from "~/core/feedback/ConfirmForm";
import type { LabOrderDetail } from "../model/lab.types";

function Hidden({ intent, id }: { intent: string; id: string }) {
    return (
        <>
            <input type="hidden" name="intent" value={intent} />
            <input type="hidden" name="orderId" value={id} />
        </>
    );
}

const PRIMARY = "ui-button inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-on-brand disabled:cursor-not-allowed disabled:opacity-50";

export function LabWorkflow({ order }: { order: LabOrderDetail }) {
    const submitting = useNavigation().state === "submitting";
    const pending = order.items.filter((i) => i.resultValue === null).length;

    if (order.status === "completado" || order.status === "cancelado") {
        return <p className="text-sm text-ink-muted">Esta orden está cerrada y ya no admite cambios.</p>;
    }

    return (
        <div className="flex flex-col gap-3">
            {order.status === "solicitado" && (
                <Form method="post">
                    <Hidden intent="sample" id={order.id} />
                    <button type="submit" disabled={submitting} className={PRIMARY}>
                        <TestTube aria-hidden className="size-4" />
                        Registrar toma de muestra
                    </button>
                </Form>
            )}

            {order.status === "muestra_tomada" && (
                <Form method="post">
                    <Hidden intent="process" id={order.id} />
                    <button type="submit" disabled={submitting} className={PRIMARY}>
                        <FlaskRound aria-hidden className="size-4" />
                        Iniciar proceso en laboratorio
                    </button>
                </Form>
            )}

            {order.status === "en_proceso" && (
                <ConfirmForm
                    method="post"
                    confirm={{
                        tone: "default",
                        title: "¿Completar la orden?",
                        description: "Verifica que los resultados estén correctos: después no podrás editarlos.",
                        confirmLabel: "Completar orden",
                    }}
                >
                    <Hidden intent="complete" id={order.id} />
                    <button type="submit" disabled={submitting || pending > 0} className={PRIMARY}>
                        <CheckCheck aria-hidden className="size-4" />
                        Completar orden
                    </button>
                    {pending > 0 && <p className="mt-2 text-xs text-tone-red-fg">Faltan {pending} resultado(s) por registrar.</p>}
                </ConfirmForm>
            )}

            <ConfirmForm
                method="post"
                confirm={{
                    tone: "danger",
                    title: "¿Cancelar esta orden?",
                    description: "La orden quedará cancelada y no podrá reactivarse.",
                    confirmLabel: "Cancelar orden",
                }}
            >
                <Hidden intent="cancel" id={order.id} />
                <button type="submit" disabled={submitting} className="ui-button inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-tone-red-fg/40 text-sm font-semibold text-tone-red-fg hover:bg-tone-red-soft disabled:opacity-60">
                    <Ban aria-hidden className="size-4" />
                    Cancelar orden
                </button>
            </ConfirmForm>
        </div>
    );
}