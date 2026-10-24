import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { Modal } from "~/core/ui/Modal";
import type { CreatePatientResult, PatientOptions } from "../model/patient.types";
import { PatientForm } from "./PatientForm";

export function NewPatientDialog({ options }: { options: PatientOptions }) {
    const fetcher = useFetcher<CreatePatientResult>();
    const [open, setOpen] = useState(false);
    const [saved, setSaved] = useState(false);
    const [formKey, setFormKey] = useState(0);

    const result = fetcher.data;
    const submitting = fetcher.state !== "idle";

    useEffect(() => {
        if (fetcher.state === "idle" && result?.ok) {
            setOpen(false);
            setSaved(true);
            setFormKey((key) => key + 1); // limpia el formulario
        }
    }, [fetcher.state, result]);

    const openDialog = () => {
        setSaved(false);
        setOpen(true);
    };

    return (
        <>
            <button
                type="button"
                onClick={openDialog}
                className="ui-button inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-on-brand shadow-md shadow-brand/30 hover:opacity-90"
            >
                <Plus className="size-5" aria-hidden />
                Registrar paciente
            </button>
            {saved ? <p role="status" className="mt-2 text-sm font-semibold text-tone-green-fg">Paciente registrado correctamente.</p> : null}

            <Modal open={open} onClose={() => setOpen(false)} title="Registrar paciente">
                <fetcher.Form key={formKey} method="post" action="/pacientes/nuevo">
                    <PatientForm
                        options={options}
                        errors={result && !result.ok ? result.fieldErrors : undefined}
                        formError={result && !result.ok ? result.formError : undefined}
                        submitting={submitting}
                        onCancel={() => setOpen(false)}
                    />
                </fetcher.Form>
            </Modal>
        </>
    );
}