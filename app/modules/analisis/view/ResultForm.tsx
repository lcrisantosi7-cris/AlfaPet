import { CheckCircle2 } from "lucide-react";
import { Form, useNavigation } from "react-router";
import { formatMoney } from "~/core/lib/format";
import type { LabItem } from "../model/lab.types";
import { formatDateTime } from "./lab-labels";

const CONTROL = "ui-field h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm disabled:opacity-60";

interface ResultFormProps {
    orderId: string;
    item: LabItem;
    editable: boolean;
}

export function ResultForm({ orderId, item, editable }: ResultFormProps) {
    const submitting = useNavigation().state === "submitting";
    const done = item.resultValue !== null;

    return (
        <Form method="post" className="grid gap-3 rounded-xl border border-line bg-bg p-4 sm:grid-cols-6">
            <input type="hidden" name="intent" value="result" />
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="itemId" value={item.id} />

            <header className="flex flex-wrap items-center justify-between gap-2 sm:col-span-6">
                <div>
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="text-xs text-ink-muted">{item.sampleType ?? "Muestra"} · {formatMoney(item.price)}</p>
                </div>
                {done && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-tone-green-fg">
                        <CheckCircle2 aria-hidden className="size-4" />
                        {item.resultedByName ?? "Registrado"}{item.resultedAt ? ` · ${formatDateTime(item.resultedAt)}` : ""}
                    </span>
                )}
            </header>

            <label className="flex flex-col gap-1.5 text-xs font-semibold sm:col-span-3">
                Resultado *
                <input name="value" required maxLength={500} defaultValue={item.resultValue ?? ""} disabled={!editable} className={CONTROL} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold sm:col-span-1">
                Unidad
                <input name="unit" maxLength={40} defaultValue={item.resultUnit ?? ""} disabled={!editable} className={CONTROL} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold sm:col-span-2">
                Rango de referencia
                <input name="range" maxLength={100} defaultValue={item.referenceRange ?? ""} disabled={!editable} className={CONTROL} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold sm:col-span-6">
                Observaciones
                <input name="notes" maxLength={1000} defaultValue={item.resultNotes ?? ""} disabled={!editable} className={CONTROL} />
            </label>

            {editable && (
                <button type="submit" disabled={submitting} className="ui-button h-10 rounded-xl border border-line px-5 text-sm font-semibold hover:border-brand hover:text-brand-text disabled:opacity-60 sm:col-span-6 sm:justify-self-end">
                    {done ? "Actualizar resultado" : "Guardar resultado"}
                </button>
            )}
        </Form>
    );
}