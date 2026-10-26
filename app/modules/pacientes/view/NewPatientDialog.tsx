import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "~/core/feedback/toast-store";
import { Modal } from "~/core/ui/Modal";
import type { CreatePatientResult, OwnerOption, PatientOptions } from "../model/patient.types";
import { PatientForm } from "./PatientForm";

interface Props {
    options: PatientOptions;
    owners?: OwnerOption[];
    presetOwnerId?: string;
    label?: string;
    compact?: boolean;
}

export function NewPatientDialog({ options, owners = [], presetOwnerId, label = "Registrar paciente", compact = false }: Props) {
    const fetcher = useFetcher<CreatePatientResult>();
    const [open, setOpen] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const result = fetcher.data;

    useEffect(() => {
        if (fetcher.state === "idle" && result?.ok) {
            setOpen(false);
            toast.success(presetOwnerId ? "Mascota agregada" : "Paciente registrado", "La ficha ya está disponible.");
            setFormKey((k) => k + 1);
        }
    }, [fetcher.state, result, presetOwnerId]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={compact
                    ? "ui-button inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-on-brand shadow-sm shadow-brand/25 hover:opacity-90"
                    : "ui-button inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-on-brand shadow-md shadow-brand/30 hover:opacity-90"}
            >
                <Plus className="size-5" aria-hidden />
                {label}
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title={presetOwnerId ? "Agregar mascota" : "Registrar paciente"}>
                <fetcher.Form key={formKey} method="post" action="/pacientes/nuevo">
                    <PatientForm
                        options={options}
                        owners={owners}
                        presetOwnerId={presetOwnerId}
                        errors={result && !result.ok ? result.fieldErrors : undefined}
                        formError={result && !result.ok ? result.formError : undefined}
                        submitting={fetcher.state !== "idle"}
                        onCancel={() => setOpen(false)}
                    />
                </fetcher.Form>
            </Modal>
        </>
    );
}