import { CalendarPlus, FlaskConical, PawPrint, Scissors, ShoppingCart } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

interface AdminHeroProps {
    greeting: string;
    firstName: string;
    todayLabel: string;
    appointments: number;
    surgeries: number;
    alerts: number;
    /** Botón principal (registrar paciente). */
    primaryAction: ReactNode;
}

const QUICK_ACTIONS = [
    { to: "/ventas", label: "Nueva venta", icon: ShoppingCart },
    { to: "/citas", label: "Nueva cita", icon: CalendarPlus },
    { to: "/cirugias", label: "Cirugía", icon: Scissors },
    { to: "/analisis", label: "Análisis", icon: FlaskConical },
] as const;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function AdminHero({ greeting, firstName, todayLabel, appointments, surgeries, alerts, primaryAction }: AdminHeroProps) {
    const summary = [
        plural(appointments, "cita", "citas"),
        plural(surgeries, "cirugía", "cirugías"),
        alerts === 0 ? "sin alertas" : plural(alerts, "alerta", "alertas"),
    ].join(" · ");

    return (
        <section aria-labelledby="admin-greeting" className="admin-hero rise-in rounded-2xl border border-line px-5 py-4 shadow-card sm:px-6" style={{ "--i": 0 } as React.CSSProperties}>
            <PawPrint aria-hidden className="admin-hero__paw" />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-muted capitalize">
                        <span className="ui-dot-pulse size-2 rounded-full bg-tone-green-fg text-tone-green-fg" aria-hidden />
                        {todayLabel}
                    </p>
                    <h1 id="admin-greeting" className="mt-1 text-2xl font-extrabold tracking-tight sm:text-[1.75rem]">
                        {greeting}, <span className="text-brand-text">{firstName}</span>
                    </h1>
                    <p className="mt-1 text-sm text-ink-muted">Hoy: {summary}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {QUICK_ACTIONS.map(({ to, label, icon: Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            className="ui-button group inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface/80 px-3 text-sm font-semibold backdrop-blur hover:border-brand/50 hover:text-brand-text"
                        >
                            <Icon aria-hidden className="size-4 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
                            <span className="hidden sm:inline">{label}</span>
                            <span className="sr-only sm:hidden">{label}</span>
                        </Link>
                    ))}
                    {primaryAction}
                </div>
            </div>
        </section>
    );
}