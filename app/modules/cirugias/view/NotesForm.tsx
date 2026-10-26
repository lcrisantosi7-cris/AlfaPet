import { Form, useNavigation } from "react-router";
import type { SurgeryDetail } from "../model/surgery.types";

const AREA = "ui-field w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm disabled:opacity-60";

export function NotesForm({ surgery }: { surgery: SurgeryDetail }) {
    const submitting = useNavigation().state === "submitting";
    const locked = surgery.status === "cancelada";

    const fields = [
        { name: "preOpNotes", label: "Notas preoperatorias", value: surgery.preOpNotes, max: 2000, rows: 3 },
        { name: "anesthesiaNotes", label: "Protocolo anestésico", value: surgery.anesthesiaNotes, max: 2000, rows: 3 },
        { name: "procedureNotes", label: "Descripción del procedimiento", value: surgery.procedureNotes, max: 4000, rows: 6 },
        { name: "postOpInstructions", label: "Indicaciones postoperatorias", value: surgery.postOpInstructions, max: 2000, rows: 3 },
    ];

    return (
        <Form method="post" className="flex flex-col gap-4">
            <input type="hidden" name="intent" value="notes" />
            <input type="hidden" name="surgeryId" value={surgery.id} />
            {fields.map((field) => (
                <label key={field.name} className="flex flex-col gap-1.5 text-sm font-semibold">
                    {field.label}
                    <textarea name={field.name} defaultValue={field.value ?? ""} maxLength={field.max} rows={field.rows} disabled={locked} className={AREA} />
                </label>
            ))}
            {!locked && (
                <button type="submit" disabled={submitting} className="ui-button h-11 self-end rounded-xl bg-brand px-6 text-sm font-bold text-on-brand disabled:opacity-60">
                    {submitting ? "Guardando…" : "Guardar notas"}
                </button>
            )}
        </Form>
    );
}