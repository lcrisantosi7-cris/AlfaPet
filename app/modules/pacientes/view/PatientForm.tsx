import { SelectField, TextField } from "~/core/ui/form-fields";
import type { PatientFieldErrors, PatientOptions } from "../model/patient.types";

interface PatientFormProps {
    options: PatientOptions;
    errors?: PatientFieldErrors;
    formError?: string;
    submitting: boolean;
    onCancel: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function PatientForm({ options, errors, formError, submitting, onCancel }: PatientFormProps) {
    const first = (field: keyof PatientFieldErrors) => errors?.[field]?.[0];

    return (
        <>
            <fieldset className="ui-form-section grid gap-4 sm:grid-cols-2">
                <legend className="px-2 text-sm font-bold text-ink">Datos del dueño</legend>
                <TextField label="Nombre completo" name="ownerName" required maxLength={120} autoComplete="off" error={first("ownerName")} className="sm:col-span-2" />
                <TextField
                    label="Teléfono"
                    hint="9 dígitos, sin espacios ni guiones."
                    name="ownerPhone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={9}
                    pattern="[0-9]{9}"
                    title="Ingresa exactamente 9 dígitos."
                    placeholder="987654321"
                    onChange={(event) => {
                        event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 9);
                    }}
                    error={first("ownerPhone")}
                />
                <TextField label="Correo" name="ownerEmail" type="email" maxLength={160} error={first("ownerEmail")} />
                <TextField
                    label="DNI"
                    hint="8 dígitos, sin puntos ni espacios."
                    name="ownerDocument"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={8}
                    pattern="[0-9]{8}"
                    title="Ingresa exactamente 8 dígitos."
                    placeholder="12345678"
                    onChange={(event) => {
                        event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 8);
                    }}
                    error={first("ownerDocument")}
                />
                <TextField label="Dirección" name="ownerAddress" maxLength={200} error={first("ownerAddress")} />
            </fieldset>

            <fieldset className="ui-form-section mt-4 grid gap-4 sm:grid-cols-2">
                <legend className="px-2 text-sm font-bold text-ink">Datos del paciente</legend>
                <TextField label="Nombre" name="name" required maxLength={80} autoComplete="off" error={first("name")} />
                <SelectField label="Especie" name="species" required options={options.species} error={first("species")} />
                <TextField label="Raza" name="breed" maxLength={80} error={first("breed")} />
                <SelectField label="Sexo" name="sex" options={options.sex} error={first("sex")} />
                <TextField label="Fecha de nacimiento" name="birthDate" type="date" max={today()} error={first("birthDate")} />
                <TextField label="Peso (kg)" name="weightKg" type="number" inputMode="decimal" step="0.01" min="0.01" error={first("weightKg")} />
                <TextField label="Microchip" name="microchip" maxLength={30} error={first("microchip")} className="sm:col-span-2" />
            </fieldset>

            {formError && (
                <p role="alert" className="mt-5 rounded-lg bg-tone-orange-soft px-3 py-2 text-sm text-tone-orange-fg">
                    {formError}
                </p>
            )}

            <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <button type="button" onClick={onCancel} className="ui-button h-11 rounded-xl border border-line px-5 text-sm font-semibold hover:bg-surface-muted">
                    Cancelar
                </button>
                <button type="submit" disabled={submitting} className="ui-button h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-on-brand disabled:opacity-60">
                    {submitting ? "Guardando…" : "Guardar paciente"}
                </button>
            </div>
        </>
    );
}