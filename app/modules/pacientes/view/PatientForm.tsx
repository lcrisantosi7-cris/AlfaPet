import { Search, UserCheck, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SelectField, TextField } from "~/core/ui/form-fields";
import type { OwnerOption, PatientFieldErrors, PatientOptions } from "../model/patient.types";

interface PatientFormProps {
    options: PatientOptions;
    owners: OwnerOption[];
    presetOwnerId?: string;
    errors?: PatientFieldErrors;
    formError?: string;
    submitting: boolean;
    onCancel: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const digits = (n: number) => (e: React.ChangeEvent<HTMLInputElement>) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, n); };

export function PatientForm({ options, owners, presetOwnerId, errors, formError, submitting, onCancel }: PatientFormProps) {
    const first = (f: keyof PatientFieldErrors) => errors?.[f]?.[0];
    const locked = Boolean(presetOwnerId);
    const [mode, setMode] = useState<"new" | "existing">(locked ? "existing" : "new");
    const [ownerId, setOwnerId] = useState(presetOwnerId ?? "");
    const [query, setQuery] = useState("");
    const [dupe, setDupe] = useState<OwnerOption | null>(null);

    const selected = owners.find((o) => o.id === ownerId);
    const matches = useMemo(() => {
        const q = query.trim().toLocaleLowerCase("es");
        return owners.filter((o) => !q || [o.name, o.phone, o.document].some((v) => v?.toLocaleLowerCase("es").includes(q))).slice(0, 6);
    }, [owners, query]);

    const checkDupe = (field: "document" | "phone", value: string) =>
        setDupe(value ? owners.find((o) => o[field] === value) ?? null : null);

    const useDupe = () => { if (dupe) { setOwnerId(dupe.id); setMode("existing"); setDupe(null); } };
    const tab = (active: boolean) => `ui-button inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${active ? "bg-brand text-on-brand shadow-sm" : "text-ink-muted hover:text-ink"}`;

    return (
        <>
            {!locked && (
                <div className="mb-4 flex gap-1 rounded-xl bg-surface-muted p-1" role="tablist">
                    <button type="button" role="tab" aria-selected={mode === "new"} onClick={() => { setMode("new"); setOwnerId(""); }} className={tab(mode === "new")}><UserPlus className="size-4" aria-hidden />Dueño nuevo</button>
                    <button type="button" role="tab" aria-selected={mode === "existing"} onClick={() => setMode("existing")} className={tab(mode === "existing")}><UserCheck className="size-4" aria-hidden />Dueño existente</button>
                </div>
            )}

            {mode === "existing" ? (
                <fieldset className="ui-form-section">
                    <legend className="px-2 text-sm font-bold">{locked ? "Nueva mascota de" : "Elige al dueño"}</legend>
                    <input type="hidden" name="ownerId" value={ownerId} />
                    {selected ? (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-brand/40 bg-brand-soft/60 p-3">
                            <div className="text-sm"><p className="font-bold">{selected.name}</p><p className="text-xs text-ink-muted">{selected.document ? `DNI ${selected.document}` : "Sin DNI"} · {selected.phone || "Sin teléfono"} · {selected.petCount} mascota(s)</p></div>
                            {!locked && <button type="button" onClick={() => setOwnerId("")} aria-label="Cambiar dueño" className="rounded-full border border-line p-2 hover:text-brand-text"><X className="size-4" /></button>}
                        </div>
                    ) : (
                        <>
                            <label className="relative block">
                                <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
                                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, DNI o teléfono…" className="ui-field h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-sm" />
                            </label>
                            <ul className="mt-2 flex flex-col gap-1.5">
                                {matches.length === 0 && <li className="px-2 py-3 text-sm text-ink-muted">Sin coincidencias. Prueba “Dueño nuevo”.</li>}
                                {matches.map((o) => (
                                    <li key={o.id}>
                                        <button type="button" onClick={() => setOwnerId(o.id)} className="flex w-full items-center justify-between rounded-xl border border-line px-3 py-2 text-left text-sm hover:border-brand">
                                            <span className="font-semibold">{o.name}</span>
                                            <span className="text-xs text-ink-muted">{o.document || o.phone || "—"} · {o.petCount} mascota(s)</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    {first("ownerId") && <p className="mt-2 text-xs text-tone-orange-fg">{first("ownerId")}</p>}
                </fieldset>
            ) : (
                <fieldset className="ui-form-section grid gap-4 sm:grid-cols-2">
                    <legend className="px-2 text-sm font-bold">Datos del dueño</legend>
                    {dupe && (
                        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-tone-amber-soft px-3 py-2 text-sm text-tone-amber-fg sm:col-span-2">
                            <span>Ya existe un dueño con este dato: <b>{dupe.name}</b>.</span>
                            <button type="button" onClick={useDupe} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-on-brand">Usar este dueño</button>
                        </div>
                    )}
                    <TextField label="Nombre completo" name="ownerName" required maxLength={120} autoComplete="off" error={first("ownerName")} className="sm:col-span-2" />
                    <TextField label="Teléfono" hint="9 dígitos." name="ownerPhone" type="tel" inputMode="numeric" autoComplete="tel" maxLength={9} placeholder="987654321" onChange={digits(9)} onBlur={(e) => checkDupe("phone", e.currentTarget.value)} error={first("ownerPhone")} />
                    <TextField label="Correo" name="ownerEmail" type="email" maxLength={160} error={first("ownerEmail")} />
                    <TextField label="DNI" hint="8 dígitos." name="ownerDocument" inputMode="numeric" autoComplete="off" maxLength={8} placeholder="12345678" onChange={digits(8)} onBlur={(e) => checkDupe("document", e.currentTarget.value)} error={first("ownerDocument")} />
                    <TextField label="Dirección" name="ownerAddress" maxLength={200} error={first("ownerAddress")} />
                </fieldset>
            )}

            <fieldset className="ui-form-section mt-4 grid gap-4 sm:grid-cols-2">
                <legend className="px-2 text-sm font-bold">Datos de la mascota</legend>
                <TextField label="Nombre" name="name" required maxLength={80} autoComplete="off" error={first("name")} />
                <SelectField label="Especie" name="species" required options={options.species} error={first("species")} />
                <TextField label="Raza" name="breed" maxLength={80} error={first("breed")} />
                <SelectField label="Sexo" name="sex" options={options.sex} error={first("sex")} />
                <TextField label="Fecha de nacimiento" name="birthDate" type="date" max={today()} error={first("birthDate")} />
                <TextField label="Peso inicial (kg)" name="weightKg" type="number" inputMode="decimal" step="0.01" min="0.01" error={first("weightKg")} />
                <TextField label="Microchip" name="microchip" maxLength={30} error={first("microchip")} className="sm:col-span-2" />
            </fieldset>

            {formError && <p role="alert" className="mt-5 rounded-lg bg-tone-orange-soft px-3 py-2 text-sm text-tone-orange-fg">{formError}</p>}

            <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <button type="button" onClick={onCancel} className="ui-button h-11 rounded-xl border border-line px-5 text-sm font-semibold hover:bg-surface-muted">Cancelar</button>
                <button type="submit" disabled={submitting || (mode === "existing" && !ownerId)} className="ui-button h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-on-brand disabled:opacity-60">
                    {submitting ? "Guardando…" : mode === "existing" ? "Agregar mascota" : "Guardar paciente"}
                </button>
            </div>
        </>
    );
}