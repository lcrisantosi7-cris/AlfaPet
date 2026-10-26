import { useCallback, useState } from "react";
import { PageHeader } from "~/core/ui/PageHeader";
import type { AdmissiblePatient, KennelCard, VetOption } from "../model/admission.types";
import { AdmitDialog } from "./AdmitDialog";
import { KennelBoard } from "./KennelBoard";

interface InternamientoViewProps {
    kennels: KennelCard[];
    patients: AdmissiblePatient[];
    vets: VetOption[];
    defaultRate: number;
    clinical: boolean;
    isAdmin: boolean;
}

export function InternamientoView({ kennels, patients, vets, defaultRate, clinical, isAdmin }: InternamientoViewProps) {
    const [selected, setSelected] = useState<KennelCard | null>(null);
    const close = useCallback(() => setSelected(null), []);

    const occupied = kennels.filter((k) => k.occupant).length;
    const stats = [
        { label: "Habitaciones ocupadas", value: occupied },
        { label: "Disponibles", value: kennels.length - occupied },
        { label: "Capacidad total", value: kennels.length },
    ];

    return (
        <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
            <PageHeader
                eyebrow={clinical ? "Atención clínica" : "Vista de recepción"}
                title="Internamiento"
                description={clinical
                    ? "Controla la ocupación de habitaciones, registra la evolución diaria y gestiona las altas."
                    : "Consulta qué habitaciones están disponibles. Los datos clínicos solo los ve el personal veterinario."}
            />

            <div className="grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                    <article key={stat.label} className="ui-card rounded-2xl border border-line bg-surface p-5 shadow-card">
                        <p className="text-sm text-ink-muted">{stat.label}</p>
                        <p className="mt-2 text-3xl font-extrabold tabular-nums">{stat.value}</p>
                    </article>
                ))}
            </div>

            {kennels.length === 0 ? (
                <p className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-ink-muted">
                    No hay habitaciones configuradas. Un administrador debe registrarlas.
                </p>
            ) : (
                <KennelBoard kennels={kennels} clinical={clinical} onAdmit={setSelected} />
            )}

            {clinical && (
                <AdmitDialog kennel={selected} patients={patients} vets={vets} defaultRate={defaultRate} isAdmin={isAdmin} onClose={close} />
            )}
        </section>
    );
}