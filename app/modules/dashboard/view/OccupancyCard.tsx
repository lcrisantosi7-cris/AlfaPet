import { BedDouble } from "lucide-react";
import { ActionLink } from "~/core/ui/ActionLink";
import { EmptyState } from "~/core/ui/EmptyState";
import { SectionCard } from "~/core/ui/SectionCard";

export function OccupancyCard({ active, capacity }: { active: number; capacity: number }) {
    const percent = capacity > 0 ? Math.min(100, (active / capacity) * 100) : 0;
    const free = Math.max(capacity - active, 0);

    return (
        <SectionCard title="Ocupación de habitaciones" icon={BedDouble} action={<ActionLink to="/internamiento">Ver tablero</ActionLink>}>
            {capacity === 0 ? (
                <EmptyState icon={BedDouble} title="Sin habitaciones configuradas" />
            ) : (
                <div className="flex items-center gap-5">
                    <div className="relative size-28 shrink-0">
                        <svg viewBox="0 0 36 36" className="size-full -rotate-90" role="img" aria-label={`${active} de ${capacity} habitaciones ocupadas`}>
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--surface-muted)" strokeWidth="3.6" />
                            <circle
                                cx="18" cy="18" r="15.9155" fill="none" stroke="var(--brand)" strokeWidth="3.6" strokeLinecap="round"
                                strokeDasharray={`${percent} 100`} className="ring-sweep"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl leading-none font-extrabold tabular-nums">{Math.round(percent)}%</span>
                            <span className="mt-0.5 text-[10px] font-semibold text-ink-muted uppercase">ocupado</span>
                        </div>
                    </div>
                    <dl className="grid flex-1 gap-3 text-sm">
                        <div className="flex items-center justify-between"><dt className="text-ink-muted">Ocupadas</dt><dd className="font-bold tabular-nums">{active}</dd></div>
                        <div className="flex items-center justify-between"><dt className="text-ink-muted">Disponibles</dt><dd className="font-bold text-tone-green-fg tabular-nums">{free}</dd></div>
                        <div className="flex items-center justify-between border-t border-line pt-3"><dt className="text-ink-muted">Capacidad</dt><dd className="font-bold tabular-nums">{capacity}</dd></div>
                    </dl>
                </div>
            )}
        </SectionCard>
    );
}