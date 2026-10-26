import { CalendarClock, CheckCircle2, PawPrint, Search, ShieldAlert, Syringe } from "lucide-react";
import { useMemo, useState } from "react";
import { Form, useActionData } from "react-router";
import { ConfirmForm } from "~/core/feedback/ConfirmForm";
import { useActionToast } from "~/core/feedback/use-action-toast";
import { Badge, type BadgeVariant } from "~/core/ui/Badge";
import { PageHeader } from "~/core/ui/PageHeader";
import { dateLabel } from "~/modules/pacientes/view/patient-labels";
import type { VaccinationRow, VaccinePatientOption, VaccineOption, VacunaActionResult } from "../model/vacuna.types";
import { addDays, limaToday } from "../model/vacuna-dates";
import { VaccinationDialog } from "./VaccinationDialog";

type Key = "vencida" | "proxima" | "pendiente" | "aplicada";
const RANK: Record<Key, number> = { vencida: 0, proxima: 1, pendiente: 2, aplicada: 3 };
const CHIPS = [["todas", "Todas"], ["pendientes", "Pendientes"], ["vencida", "Vencidas"], ["aplicada", "Aplicadas"]] as const;

function status(r: VaccinationRow, today: string): { key: Key; label: string; variant: BadgeVariant } {
    if (r.appliedAt) return { key: "aplicada", label: "Aplicada", variant: "success" };
    if (r.dueDate < today) return { key: "vencida", label: "Vencida", variant: "danger" };
    if (r.dueDate <= addDays(today, 7)) return { key: "proxima", label: "Próxima (7 días)", variant: "warning" };
    return { key: "pendiente", label: "Pendiente", variant: "info" };
}

export function VacunasView({ rows, patients, vaccines }: { rows: VaccinationRow[]; patients: VaccinePatientOption[]; vaccines: VaccineOption[] }) {
    useActionToast(useActionData() as VacunaActionResult | undefined);
    const today = limaToday();
    const [query, setQuery] = useState("");
    const [chip, setChip] = useState<(typeof CHIPS)[number][0]>("todas");

    const enriched = useMemo(() => rows.map((r) => ({ r, s: status(r, today) })), [rows, today]);
    const count = (k: Key) => enriched.filter((e) => e.s.key === k).length;

    const filtered = useMemo(() => {
        const q = query.trim().toLocaleLowerCase("es");
        return enriched
            .filter(({ r, s }) => (chip === "todas" || (chip === "pendientes" ? s.key === "pendiente" || s.key === "proxima" : s.key === chip))
                && (!q || [r.patientName, r.ownerName, r.vaccineName].some((v) => v?.toLocaleLowerCase("es").includes(q))))
            .sort((a, b) => RANK[a.s.key] - RANK[b.s.key] || a.r.dueDate.localeCompare(b.r.dueDate));
    }, [enriched, query, chip]);

    const kpis = [
        { label: "Vencidas", value: count("vencida"), icon: ShieldAlert, tone: "bg-tone-red-soft text-tone-red-fg" },
        { label: "Próximas (7 días)", value: count("proxima"), icon: CalendarClock, tone: "bg-tone-amber-soft text-tone-amber-fg" },
        { label: "Pendientes", value: count("pendiente"), icon: Syringe, tone: "bg-tone-blue-icon text-tone-blue-fg" },
        { label: "Aplicadas", value: count("aplicada"), icon: CheckCircle2, tone: "bg-tone-green-icon text-tone-green-fg" },
    ];

    return (
        <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
            <PageHeader eyebrow="Atención clínica" title="Vacunas" description="Controla el esquema de vacunación. Los pacientes fallecidos no aparecen para vacunar." action={<VaccinationDialog mode="create" patients={patients} vaccines={vaccines} />} />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {kpis.map(({ label, value, icon: Icon, tone }) => (
                    <article key={label} className="ui-card flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
                        <span className={`flex size-12 items-center justify-center rounded-xl ${tone}`}><Icon className="size-6" aria-hidden /></span>
                        <div><p className="text-2xl font-extrabold leading-none">{value}</p><p className="mt-1 text-xs text-ink-muted">{label}</p></div>
                    </article>
                ))}
            </div>

            <div className="rounded-2xl border border-line bg-surface shadow-card">
                <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
                    <label className="relative min-w-0 flex-1">
                        <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar paciente, dueño o vacuna…" className="ui-field h-11 w-full rounded-xl border border-line bg-bg pl-10 pr-3 text-sm" />
                    </label>
                    <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
                        {CHIPS.map(([k, label]) => (
                            <button key={k} type="button" onClick={() => setChip(k)} className={`ui-button h-9 rounded-lg px-3 text-xs font-semibold ${chip === k ? "bg-brand text-on-brand shadow-sm" : "text-ink-muted hover:text-ink"}`}>{label}</button>
                        ))}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="px-6 py-16 text-center text-sm text-ink-muted">No hay vacunas para mostrar.</div>
                ) : (
                    <div className="ui-table-wrap">
                        <table className="w-full min-w-[820px] text-left text-sm">
                            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink-muted">
                                <tr><th className="px-5 py-4">Paciente</th><th className="px-5 py-4">Vacuna</th><th className="px-5 py-4">Próxima dosis</th><th className="px-5 py-4">Aplicada</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4">Acciones</th></tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {filtered.map(({ r, s }) => (
                                    <tr key={r.id} className={s.key === "vencida" ? "bg-tone-red-soft/40" : "hover:bg-surface-muted/70"}>
                                        <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-text"><PawPrint className="size-5" /></span><div><p className="font-bold">{r.patientName}</p><p className="text-xs text-ink-muted">{r.ownerName ?? "—"}</p></div></div></td>
                                        <td className="px-5 py-4"><p className="font-semibold">{r.vaccineName}</p>{r.lot && <p className="text-xs text-ink-muted">Lote {r.lot}</p>}</td>
                                        <td className="px-5 py-4">{dateLabel(r.dueDate)}</td>
                                        <td className="px-5 py-4 text-ink-muted">{r.appliedAt ? `${dateLabel(r.appliedAt)}${r.byName ? ` · ${r.byName}` : ""}` : "—"}</td>
                                        <td className="px-5 py-4"><Badge variant={s.variant} dot>{s.label}</Badge></td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {!r.appliedAt && (
                                                    <ConfirmForm method="post" confirm={{ title: "¿Marcar como aplicada?", description: "Se registrará hoy y se calculará la próxima dosis.", confirmLabel: "Aplicar" }}>
                                                        <input type="hidden" name="intent" value="apply" /><input type="hidden" name="recordId" value={r.id} />
                                                        <button type="submit" className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-on-brand">Aplicar</button>
                                                    </ConfirmForm>
                                                )}
                                                <VaccinationDialog mode="edit" row={r} patients={patients} vaccines={vaccines} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <footer className="border-t border-line px-5 py-3 text-xs text-ink-muted">Mostrando {filtered.length} de {rows.length} registros</footer>
            </div>
        </section>
    );
}