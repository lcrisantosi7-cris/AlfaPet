import { ConfirmForm } from "~/core/feedback/ConfirmForm";

export function DischargeForm({ admissionId }: { admissionId: string }) {
    return (
        <ConfirmForm
            method="post"
            className="flex flex-col gap-3"
            confirm={{
                tone: "danger",
                title: "¿Cerrar este internamiento?",
                description: "Se liberará la habitación y ya no se podrán agregar notas de evolución.",
                confirmLabel: "Cerrar internamiento",
            }}
        >
            <input type="hidden" name="intent" value="discharge" />
            <input type="hidden" name="admissionId" value={admissionId} />
            <fieldset className="grid grid-cols-2 gap-2">
                <legend className="mb-2 text-sm font-semibold">Resultado *</legend>
                {[{ value: "alta", label: "Alta médica" }, { value: "fallecido", label: "Fallecido" }].map((option, index) => (
                    <label key={option.value} className="ui-button flex h-10 cursor-pointer items-center justify-center rounded-lg border border-line text-sm font-semibold has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand-text">
                        <input type="radio" name="outcome" value={option.value} defaultChecked={index === 0} className="sr-only" />
                        {option.label}
                    </label>
                ))}
            </fieldset>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Indicaciones de alta / observaciones
                <textarea name="notes" maxLength={2000} rows={3} className="ui-field rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
            </label>
            <button type="submit" className="ui-button h-10 rounded-xl border border-tone-red-fg/40 px-5 text-sm font-bold text-tone-red-fg hover:bg-tone-red-soft">
                Cerrar internamiento
            </button>
        </ConfirmForm>
    );
}