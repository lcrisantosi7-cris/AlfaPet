import { Form, Link, useActionData, useNavigation } from "react-router";
import { SelectField, TextField } from "~/core/ui/form-fields";
import type { PatientDetailData } from "../model/patient.types";

type Errors = Record<string, string[] | undefined>;
const today = () => new Date().toISOString().slice(0, 10);
const digits = (n: number) => (e: React.ChangeEvent<HTMLInputElement>) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, n); };

export function PatientEditForm({ patient: p, owner: o, options, petCount }: Pick<PatientDetailData, "patient" | "owner" | "options"> & { petCount: number }) {
    const result = useActionData() as { ok?: boolean; intent?: string; fieldErrors?: Errors } | undefined;
    const busy = useNavigation().state !== "idle";
    const err = (k: string) => (result?.intent === "update" ? result.fieldErrors?.[k]?.[0] : undefined);

    return (
        <Form method="post" className="flex flex-col gap-6">
            <input type="hidden" name="intent" value="update" />
            <fieldset className="ui-form-section grid gap-4 sm:grid-cols-2">
                <legend className="px-2 text-sm font-bold">Datos del paciente</legend>
                <TextField label="Nombre" name="name" required maxLength={80} defaultValue={p.name} error={err("name")} />
                <SelectField label="Especie" name="species" required options={options.species} defaultValue={p.species} error={err("species")} />
                <TextField label="Raza" name="breed" maxLength={80} defaultValue={p.breed ?? ""} error={err("breed")} />
                <SelectField label="Sexo" name="sex" options={options.sex} defaultValue={p.sex ?? ""} error={err("sex")} />
                <TextField label="Fecha de nacimiento" name="birthDate" type="date" max={today()} defaultValue={p.birthDate ?? ""} error={err("birthDate")} />
                <TextField label="Peso actual (kg)" name="currentWeightKg" type="number" step="0.01" min="0.01" defaultValue={p.currentWeightKg ?? ""} hint="Cada cambio queda en el historial de peso." error={err("currentWeightKg")} />
                <TextField label="Color / pelaje" name="color" maxLength={40} defaultValue={p.color ?? ""} error={err("color")} />
                <TextField label="Microchip" name="microchip" maxLength={30} defaultValue={p.microchip ?? ""} error={err("microchip")} />
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="isSterilized" className="text-sm font-semibold">Esterilizado</label>
                    <select id="isSterilized" name="isSterilized" defaultValue={p.isSterilized === null ? "" : String(p.isSterilized)} className="ui-field h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm">
                        <option value="">Sin especificar</option><option value="true">Sí</option><option value="false">No</option>
                    </select>
                </div>
                <TextField label="Alergias" name="allergies" maxLength={300} defaultValue={p.allergies ?? ""} error={err("allergies")} />
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="notes" className="text-sm font-semibold">Observaciones</label>
                    <textarea id="notes" name="notes" rows={3} maxLength={1000} defaultValue={p.notes ?? ""} className="ui-field w-full rounded-xl border border-line bg-surface p-3 text-sm" />
                </div>
            </fieldset>

            <fieldset className="ui-form-section grid gap-4 sm:grid-cols-2">
                <legend className="px-2 text-sm font-bold">Datos del dueño</legend>
                {petCount > 1 && <p className="rounded-lg bg-tone-amber-soft px-3 py-2 text-xs text-tone-amber-fg sm:col-span-2">Estos datos se comparten con las {petCount} mascotas de este dueño.</p>}
                <TextField label="Nombre completo" name="ownerName" required maxLength={120} defaultValue={o.name} error={err("ownerName")} className="sm:col-span-2" />
                <TextField label="Teléfono" name="ownerPhone" type="tel" inputMode="numeric" maxLength={9} defaultValue={o.phone ?? ""} onChange={digits(9)} error={err("ownerPhone")} />
                <TextField label="DNI" name="ownerDocument" inputMode="numeric" maxLength={8} defaultValue={o.document ?? ""} onChange={digits(8)} error={err("ownerDocument")} />
                <TextField label="Correo" name="ownerEmail" type="email" maxLength={160} defaultValue={o.email ?? ""} error={err("ownerEmail")} />
                <TextField label="Dirección" name="ownerAddress" maxLength={200} defaultValue={o.address ?? ""} error={err("ownerAddress")} />
            </fieldset>

            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <Link to="?" className="ui-button inline-flex h-11 items-center justify-center rounded-xl border border-line px-5 text-sm font-semibold hover:bg-surface-muted">Cancelar</Link>
                <button type="submit" disabled={busy} className="ui-button h-11 rounded-xl bg-brand px-6 text-sm font-bold text-on-brand disabled:opacity-60">{busy ? "Guardando…" : "Guardar cambios"}</button>
            </div>
        </Form>
    );
}