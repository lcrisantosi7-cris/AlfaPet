import { CalendarClock, CalendarDays, Scissors } from "lucide-react";
import { Link } from "react-router";
import { cn } from "~/core/lib/cn";
import { ActionLink } from "~/core/ui/ActionLink";
import { Badge, type BadgeVariant } from "~/core/ui/Badge";
import { EmptyState } from "~/core/ui/EmptyState";
import { SectionCard } from "~/core/ui/SectionCard";
import type { AgendaItem } from "../model/admin-overview.types";

const STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
    pendiente: { label: "Pendiente", variant: "info" },
    confirmada: { label: "Confirmada", variant: "success" },
    completada: { label: "Atendida", variant: "success" },
    atendida: { label: "Atendida", variant: "success" },
    programada: { label: "Programada", variant: "info" },
    en_curso: { label: "En curso", variant: "warning" },
    completado: { label: "Completada", variant: "success" },
};

export function TodayAgenda({ items }: { items: readonly AgendaItem[] }) {
    return (
        <SectionCard title="Agenda de hoy" icon={CalendarClock} action={<ActionLink to="/citas">Ver citas</ActionLink>}>
            {items.length === 0 ? (
                <EmptyState icon={CalendarDays} title="Agenda libre" description="No hay citas ni cirugías programadas para hoy." />
            ) : (
                <ol className="relative -mx-2">
                    {items.map((item) => {
                        const surgery = item.kind === "cirugia";
                        const Icon = surgery ? Scissors : CalendarDays;
                        const status = STATUS[item.status] ?? { label: item.status, variant: "neutral" as BadgeVariant };
                        return (
                            <li key={`${item.kind}:${item.id}`}>
                                <Link to={item.href} className={cn("agenda-row flex items-center gap-3 rounded-xl px-2 py-2.5", item.isNext && "bg-brand-soft/60")}>
                                    <time className="w-11 shrink-0 text-sm font-bold tabular-nums">{item.timeLabel}</time>
                                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", surgery ? "bg-tone-purple-icon text-tone-purple-fg" : "bg-tone-blue-icon text-tone-blue-fg")}>
                                        <Icon aria-hidden className="size-4" />
                                        <span className="sr-only">{surgery ? "Cirugía" : "Cita"}</span>
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold">{item.title}</span>
                                        <span className="block truncate text-xs text-ink-muted">{item.subtitle}</span>
                                    </span>
                                    {item.isNext ? (
                                        <Badge variant="brand" dot pulse>Siguiente</Badge>
                                    ) : (
                                        <Badge variant={status.variant}>{status.label}</Badge>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ol>
            )}
        </SectionCard>
    );
}