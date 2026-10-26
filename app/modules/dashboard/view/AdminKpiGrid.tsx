import {
    BedDouble, CalendarDays, FlaskConical, PackageCheck, PackageX, Scissors, TrendingDown, TrendingUp, Wallet,
    type LucideIcon,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "~/core/lib/cn";
import { formatMoney } from "~/core/lib/format";
import { useCountUp } from "~/core/lib/use-count-up";
import { Sparkline } from "~/core/ui/charts/Sparkline";
import type { AdminOverview } from "../model/admin-overview.types";

type Tone = "orange" | "blue" | "green" | "purple" | "red";

const ICON_TONE: Record<Tone, string> = {
    orange: "bg-tone-orange-icon text-tone-orange-fg",
    blue: "bg-tone-blue-icon text-tone-blue-fg",
    green: "bg-tone-green-icon text-tone-green-fg",
    purple: "bg-tone-purple-icon text-tone-purple-fg",
    red: "bg-tone-red-soft text-tone-red-fg",
};

const ACCENT: Record<Tone, string> = {
    orange: "var(--brand)",
    blue: "var(--tone-blue-fg)",
    green: "var(--tone-green-fg)",
    purple: "var(--tone-purple-fg)",
    red: "var(--tone-red-fg)",
};

function CountUp({ value, format }: { value: number; format?: (n: number) => string }) {
    const current = useCountUp(value);
    return <>{format ? format(current) : Math.round(current)}</>;
}

function Progress({ value, total, className }: { value: number; total: number; className: string }) {
    const percent = total > 0 ? Math.min(100, (value / total) * 100) : 0;
    return (
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted" role="presentation">
            <div className={cn("bar-grow h-full rounded-full", className)} style={{ width: `${percent}%` }} />
        </div>
    );
}

interface KpiProps {
    index: number;
    to: string;
    label: string;
    icon: LucideIcon;
    tone: Tone;
    value: number;
    format?: (n: number) => string;
    foot: ReactNode;
    visual?: ReactNode;
}

function Kpi({ index, to, label, icon: Icon, tone, value, format, foot, visual }: KpiProps) {
    return (
        <li className="contents">
            <Link
                to={to}
                style={{ "--i": index + 1, "--kpi-accent": ACCENT[tone] } as CSSProperties}
                className="kpi-card ui-card rise-in flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card"
            >
                <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-ink-muted">{label}</span>
                    <span className={cn("kpi-icon flex size-9 shrink-0 items-center justify-center rounded-xl", ICON_TONE[tone])}>
                        <Icon aria-hidden className="size-[18px]" />
                    </span>
                </div>
                <p className="text-[1.65rem] leading-none font-extrabold tracking-tight tabular-nums">
                    <CountUp value={value} format={format} />
                </p>
                <div className="text-xs text-ink-muted">{foot}</div>
                {visual}
            </Link>
        </li>
    );
}

export function AdminKpiGrid({ overview }: { overview: AdminOverview }) {
    const { revenue, appointments, surgeries, admissions } = overview;
    const delta = revenue.yesterday > 0 ? ((revenue.today - revenue.yesterday) / revenue.yesterday) * 100 : null;
    const up = (delta ?? 0) >= 0;
    const DeltaIcon = up ? TrendingUp : TrendingDown;

    return (
        <ul aria-label="Indicadores del día" className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
            <Kpi
                index={0} to="/ventas?vista=historial" label="Ingresos de hoy" icon={Wallet} tone="orange"
                value={revenue.today} format={formatMoney}
                foot={
                    delta === null ? (
                        <span>{revenue.today > 0 ? "Sin ventas ayer" : "Aún sin ventas hoy"}</span>
                    ) : (
                        <span className={cn("inline-flex items-center gap-1 font-semibold", up ? "text-tone-green-fg" : "text-tone-red-fg")}>
                            <DeltaIcon aria-hidden className="size-3.5" />
                            {Math.abs(delta).toFixed(0)}% vs ayer
                        </span>
                    )
                }
                visual={<Sparkline values={revenue.series.map((p) => p.total)} className="-mb-1 h-8 w-full text-brand" />}
            />
            <Kpi
                index={1} to="/citas" label="Citas de hoy" icon={CalendarDays} tone="blue" value={appointments.total}
                foot={`${appointments.done} atendidas de ${appointments.total}`}
                visual={<Progress value={appointments.done} total={appointments.total} className="bg-tone-blue-fg" />}
            />
            <Kpi
                index={2} to="/cirugias" label="Cirugías de hoy" icon={Scissors} tone="purple" value={surgeries.today}
                foot={
                    surgeries.inProgress > 0 ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-tone-orange-fg">
                            <span className="ui-dot-pulse size-2 rounded-full bg-tone-orange-fg text-tone-orange-fg" aria-hidden />
                            {surgeries.inProgress} en curso
                        </span>
                    ) : (
                        `${surgeries.upcoming} próximas en 7 días`
                    )
                }
            />
            <Kpi
                index={3} to="/internamiento" label="Internamiento" icon={BedDouble} tone="orange" value={admissions.active}
                foot={`de ${admissions.capacity} habitaciones`}
                visual={<Progress value={admissions.active} total={admissions.capacity} className="bg-brand" />}
            />
            <Kpi
                index={4} to="/analisis" label="Análisis pendientes" icon={FlaskConical} tone="blue" value={overview.labPending}
                foot="órdenes abiertas"
            />
            <Kpi
                index={5} to="/productos" label="Stock bajo" icon={overview.lowStock > 0 ? PackageX : PackageCheck}
                tone={overview.lowStock > 0 ? "red" : "green"} value={overview.lowStock}
                foot={overview.lowStock > 0 ? "productos bajo el mínimo" : "Inventario abastecido"}
            />
        </ul>
    );
}