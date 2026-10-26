import { ClipboardList, PawPrint, Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Badge } from "~/core/ui/Badge";
import { PageHeader } from "~/core/ui/PageHeader";
import type { HistorialRow } from "../model/historial.types";

export function HistorialView({ rows }: { rows: HistorialRow[] }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [state, setState] = useState("todos");
    const states = useMemo(() => [...new Set(rows.map((r) => r.stateLabel))], [rows]);

    const filtered = useMemo(() => {
        const q = query.trim().toLocaleLowerCase("es");
        return rows.filter((r) => (state === "todos" || r.stateLabel === state) && (!q || [r.name, r.ownerName, r.vetName].some((v) => v?.toLocaleLowerCase("es").includes(q))));
    }, [rows, query, state]);

    return (
        <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
            <PageHeader eyebrow="Atención clínica" title="Historial clínico" description="Haz clic en un paciente para ver todo su historial: consultas, vacunas, cirugías, análisis e internamientos." />

            <div className="rounded-2xl border border-line bg-surface shadow-card">
                <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
                    <label className="relative min-w-0 flex-1">
                        <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por dueño, mascota o veterinario…" className="ui-field h-11 w-full rounded-xl border border-line bg-bg pl-10 pr-3 text-sm" />
                    </label>
                    <select aria-label="Estado" value={state} onChange={(e) => setState(e.target.value)} className="ui-field h-11 rounded-xl border border-line bg-bg px-3 text-sm">
                        <option value="todos">Todos los estados</option>
                        {states.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {filtered.length === 0 ? (
                    <div className="px-6 py-16 text-center text-sm text-ink-muted">No hay registros para mostrar.</div>
                ) : (
                    <div className="ui-table-wrap">
                        <table className="w-full min-w-[700px] text-left text-sm">
                            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink-muted">
                                <tr><th className="px-5 py-4">Dueño</th><th className="px-5 py-4">Paciente</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4">Veterinario</th><th className="px-5 py-4 text-right">Historial</th></tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {filtered.map((r) => (
                                    <tr key={r.id} onClick={() => navigate(`/historial-clinico/${r.id}`)} className="cursor-pointer transition-colors hover:bg-brand-soft/40">
                                        <td className="px-5 py-4"><div className="flex items-start gap-2"><UserRound className="mt-0.5 size-4 text-ink-muted" /><div><p className="font-semibold">{r.ownerName ?? "—"}</p><p className="text-xs text-ink-muted">{r.ownerPhone || "Sin teléfono"}</p></div></div></td>
                                        <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-text"><PawPrint className="size-5" /></span><div><p className="font-bold">{r.name}</p><p className="text-xs capitalize text-ink-muted">{r.species.replaceAll("_", " ")}</p></div></div></td>
                                        <td className="px-5 py-4"><Badge variant={r.stateVariant} dot>{r.stateLabel}</Badge></td>
                                        <td className="px-5 py-4">{r.vetName}</td>
                                        <td className="px-5 py-4 text-right"><Link to={`/historial-clinico/${r.id}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:border-brand hover:text-brand-text"><ClipboardList className="size-3.5" />Abrir</Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <footer className="border-t border-line px-5 py-3 text-xs text-ink-muted">Mostrando {filtered.length} de {rows.length} pacientes</footer>
            </div>
        </section>
    );
}