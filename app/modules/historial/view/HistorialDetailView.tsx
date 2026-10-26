import { ArrowLeft, BedDouble, ClipboardList, FlaskConical, PawPrint, Pill, Scissors, Stethoscope, Syringe, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge, statusVariant } from "~/core/ui/Badge";
import { SectionCard } from "~/core/ui/SectionCard";
import type { HistorialPatient, TimelineItem } from "../model/historial.types";

const ICON: Record<string, LucideIcon> = { Consulta: Stethoscope, Vacunación: Syringe, Cirugía: Scissors, Análisis: FlaskConical, Internamiento: BedDouble, Receta: Pill };
const LINK: Record<string, string> = { consultations: "/consultas", surgeries: "/cirugias", lab_orders: "/analisis", admissions: "/internamiento" };
const when = (iso: string) => new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(iso));

export function HistorialDetailView({ patient: p, timeline }: { patient: HistorialPatient; timeline: TimelineItem[] }) {
    const [type, setType] = useState("todos");
    const counts = useMemo(() => {
        const m = new Map<string, number>();
        for (const t of timeline) m.set(t.type, (m.get(t.type) ?? 0) + 1);
        return [...m.entries()];
    }, [timeline]);
    const items = timeline.filter((t) => type === "todos" || t.type === type);

    return (
        <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
            <Link to="/historial-clinico" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-ink-muted hover:text-brand-text"><ArrowLeft aria-hidden className="size-4" />Volver al historial</Link>

            <header className="flex flex-wrap items-center gap-3">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-text"><PawPrint className="size-7" /></span>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">{p.name}</h1>
                    <p className="text-sm text-ink-muted"><span className="capitalize">{p.species.replaceAll("_", " ")}</span>{p.breed ? ` · ${p.breed}` : ""} · Dueño: {p.ownerName ?? "—"}{p.ownerPhone ? ` (${p.ownerPhone})` : ""}</p>
                </div>
                <Badge variant={p.lifeStatus === "fallecido" ? "neutral" : p.isActive ? "success" : "warning"} dot>{p.lifeStatus === "fallecido" ? "Fallecido" : p.isActive ? "Activo" : "Inactivo"}</Badge>
                <Link to={`/pacientes/${p.id}`} className="ui-button ml-auto inline-flex h-10 items-center rounded-xl border border-line px-4 text-sm font-semibold hover:border-brand hover:text-brand-text">Ver ficha del paciente</Link>
            </header>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                {counts.map(([t, n]) => {
                    const Icon = ICON[t] ?? ClipboardList;
                    return (
                        <button key={t} type="button" onClick={() => setType(type === t ? "todos" : t)} className={`ui-card flex items-center gap-3 rounded-2xl border bg-surface p-3 text-left shadow-card ${type === t ? "border-brand" : "border-line"}`}>
                            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-text"><Icon className="size-5" aria-hidden /></span>
                            <div><p className="text-xl font-extrabold leading-none">{n}</p><p className="mt-1 text-xs text-ink-muted">{t}</p></div>
                        </button>
                    );
                })}
            </div>

            <SectionCard title="Línea de tiempo clínica" icon={ClipboardList} action={type !== "todos" ? <button type="button" onClick={() => setType("todos")} className="text-xs font-semibold text-brand-text hover:underline">Quitar filtro</button> : undefined}>
                {items.length === 0 ? (
                    <p className="py-6 text-center text-sm text-ink-muted">Este paciente aún no tiene registros clínicos.</p>
                ) : (
                    <ol className="relative flex flex-col gap-4 border-l-2 border-line pl-6">
                        {items.map((t) => {
                            const Icon = ICON[t.type] ?? ClipboardList;
                            const href = LINK[t.sourceTable] ? `${LINK[t.sourceTable]}/${t.sourceId}` : null;
                            const sv = t.status ? statusVariant(t.status) : null;
                            return (
                                <li key={`${t.sourceTable}-${t.sourceId}`} className="relative">
                                    <span className="absolute -left-[2.15rem] flex size-8 items-center justify-center rounded-full border-2 border-surface bg-brand text-on-brand"><Icon className="size-4" aria-hidden /></span>
                                    <div className="rounded-2xl border border-line bg-bg p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="brand">{t.type}</Badge>
                                            {sv && <Badge variant={sv.variant}>{t.status!.replaceAll("_", " ")}</Badge>}
                                            <span className="ml-auto text-xs text-ink-muted">{when(t.occurredAt)}</span>
                                        </div>
                                        <p className="mt-2 font-bold">{t.title}</p>
                                        {t.detail && <p className="mt-1 line-clamp-3 text-sm text-ink-muted">{t.detail}</p>}
                                        <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
                                            <span>{t.author ? `Por ${t.author}` : ""}</span>
                                            {href && <Link to={href} className="font-semibold text-brand-text hover:underline">Ver detalle →</Link>}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </SectionCard>
        </section>
    );
}