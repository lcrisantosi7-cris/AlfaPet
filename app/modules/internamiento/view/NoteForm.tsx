import { Send } from "lucide-react";
import { useEffect, useRef } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import { useActionToast } from "~/core/feedback/use-action-toast";
import type { InternamientoResult } from "../model/admission.types";

const CONTROL = "ui-field h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm";

export function NoteForm({ admissionId }: { admissionId: string }) {
    const result = useActionData<InternamientoResult>();
    const submitting = useNavigation().state === "submitting";
    const formRef = useRef<HTMLFormElement>(null);
    useActionToast(result);

    useEffect(() => {
        if (result?.ok && result.intent === "note") formRef.current?.reset();
    }, [result]);

    return (
        <Form ref={formRef} method="post" className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="intent" value="note" />
            <input type="hidden" name="admissionId" value={admissionId} />
            <label className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">
                Nota de evolución *
                <textarea name="note" required maxLength={2000} rows={3} placeholder="Estado general, alimentación, medicación administrada…" className={`${CONTROL} h-auto py-2`} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Peso (kg)
                <input name="weightKg" type="number" min="0.01" max="5000" step="0.01" className={CONTROL} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Temperatura (°C)
                <input name="temperatureC" type="number" min="30" max="45" step="0.1" className={CONTROL} />
            </label>
            <button type="submit" disabled={submitting} className="ui-button inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand disabled:opacity-60 sm:col-span-2 sm:justify-self-end">
                <Send aria-hidden className="size-4" />
                {submitting ? "Guardando…" : "Registrar nota"}
            </button>
        </Form>
    );
}