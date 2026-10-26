import { CalendarCheck, PawPrint, Scale, Search, Stethoscope } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { PageHeader } from "~/core/ui/PageHeader";
import type { AppointmentOption, ConsultaRow, PatientOption } from "../model/consulta.types";
import { NewConsultaDialog } from "./NewConsultaDialog";

export const fmtDateTime = (iso: string) => new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(iso));

export function ConsultasView({ rows, patients, appointments }: { rows: ConsultaRow[]; patients: PatientOption[]; appointments: AppointmentOption[] }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
        const q = query.trim().toLocaleLowerCase("es");
        return rows.filter((r) => !q || [r.patientName, r.ownerName, r.vetName].some((v) => v?.toLocaleLowerCase("es").includes(q)));
    }, [rows, query]);

    const kpis = [
        { label: "Consultas", value: rows.length, icon: Stethoscope, tone: "bg-tone-orange-icon text-tone-orange-fg" },
        { label: "Con cita", value: rows.filter((r) => r.appointmentLabel).length, icon: CalendarCheck, tone: "bg-tone-green-icon text-tone-green-fg" },
        { label: "Con peso registrado", value: rows.filter((r) => r.weightKg).length, icon: Scale, tone: "bg-tone-blue-icon text-tone-blue-fg" },
    ];

    return (
        <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
            <PageHeader eyebrow="Atención clínica" title="Consultas" description="Registra consultas y abre cada una para ver el detalle completo o editarla." action={<NewConsultaDialog patients={patients} appointments={appointments} />} />

            <div className="grid gap-4 sm:grid-cols-3">
                {kpis.map(({ label, value, icon: Icon, tone }) => (
                    <article key={label} className="ui-card flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
                        <span className={`flex size-12 items-center justify-center rounded-xl ${tone}`}><Icon className="size-6" aria-hidden /></span>
                        <div><p className="text-2xl font-extrabold leading-none">{value}</p><p className="mt-1 text-xs text-ink-muted">{label}</p></div>
                    </article>
                ))}
            </div>

            <div className="rounded-2xl border border-line bg-surface shadow-card">
                <div className="border-b border-line p-4">
                    <label className="relative block">
                        <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por paciente, dueño o veterinario…" className="ui-field h-11 w-full rounded-xl border border-line bg-bg pl-10 pr-3 text-sm" />
                    </label>
                </div>
                {filtered.length === 0 ? (
                    <div className="px-6 py-16 text-center text-sm text-ink-muted">No hay consultas para mostrar.</div>
                ) : (
                    <div className="ui-table-wrap">
                        <table className="w-full min-w-[820px] text-left text-sm">
                            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink-muted">
                                <tr><th className="px-5 py-4">Paciente</th><th className="px-5 py-4">Cita relacionada</th><th className="px-5 py-4">Veterinario</th><th className="px-5 py-4">Peso actual</th><th className="px-5 py-4">Fecha de registro</th><th className="px-5 py-4 text-right">Detalle</th></tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {filtered.map((r) => (
                                    <tr key={r.id} onClick={() => navigate(`/consultas/${r.id}`)} className="cursor-pointer transition-colors hover:bg-brand-soft/40">
                                        <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-text"><PawPrint className="size-5" /></span><div><p className="font-bold">{r.patientName}</p><p className="text-xs text-ink-muted">{r.ownerName ?? "—"}</p></div></div></td>
                                        <td className="px-5 py-4 text-ink-muted">{r.appointmentLabel ?? "Sin cita"}</td>
                                        <td className="px-5 py-4">{r.vetName ?? "—"}</td>
                                        <td className="px-5 py-4 font-semibold">{r.weightKg ? `${r.weightKg} kg` : "—"}</td>
                                        <td className="px-5 py-4 text-ink-muted">{fmtDateTime(r.createdAt)}</td>
                                        <td className="px-5 py-4 text-right"><Link to={`/consultas/${r.id}`} onClick={(e) => e.stopPropagation()} className="inline-flex rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:border-brand hover:text-brand-text">Abrir</Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}