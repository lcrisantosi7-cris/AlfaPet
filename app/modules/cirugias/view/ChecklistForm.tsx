import { Form, useNavigation } from "react-router";
import type { SurgeryDetail } from "../model/surgery.types";

export function ChecklistForm({ surgery }: { surgery: SurgeryDetail }) {
    const submitting = useNavigation().state === "submitting";
    const editable = surgery.status === "programada";

    const items = [
        { name: "consentSigned", label: "Consentimiento informado firmado", hint: "Obligatorio para iniciar la cirugía.", checked: surgery.consentSigned },
        { name: "fastingConfirmed", label: "Ayuno confirmado con el propietario", hint: "Evita complicaciones con la anestesia.", checked: surgery.fastingConfirmed },
    ];

    return (
        <Form method="post" className="flex flex-col gap-4">
            <input type="hidden" name="intent" value="checklist" />
            <input type="hidden" name="surgeryId" value={surgery.id} />
            {items.map((item) => (
                <label key={item.name} className="flex items-start gap-3 rounded-xl border border-line bg-bg p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                    <input type="checkbox" name={item.name} defaultChecked={item.checked} disabled={!editable} className="mt-1 size-4 accent-[var(--color-brand)]" />
                    <span className="text-sm">
                        <span className="font-semibold">{item.label}</span>
                        <span className="block text-xs text-ink-muted">{item.hint}</span>
                    </span>
                </label>
            ))}
            {editable && (
                <button type="submit" disabled={submitting} className="ui-button h-10 rounded-xl border border-line text-sm font-semibold hover:border-brand hover:text-brand-text disabled:opacity-60">
                    {submitting ? "Guardando…" : "Guardar lista previa"}
                </button>
            )}
        </Form>
    );
}