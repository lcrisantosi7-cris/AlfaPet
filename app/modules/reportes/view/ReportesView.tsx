import {
    AlertTriangle, BedDouble, CalendarDays, CheckCircle2, Info, PawPrint, Receipt, ShoppingCart, Stethoscope,
    Syringe, TrendingDown, TrendingUp, Wallet,
} from "lucide-react";
import { Form, Link } from "react-router";
import { formatMoney } from "~/core/lib/format";
import { DonutLegend } from "~/core/ui/charts/DonutLegend";
import { HBarList } from "~/core/ui/charts/HBarList";
import { LineChart } from "~/core/ui/charts/LineChart";
import { PageHeader } from "~/core/ui/PageHeader";
import { SectionCard } from "~/core/ui/SectionCard";
import type { ReportAlert, ReporteData } from "../model/reporte.types";

const PRESETS = [[7, "7 días"], [30, "30 días"], [90, "90 días"], [365, "12 meses"]] as const;
const compact = (n: number) => (n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : String(Math.round(n * 100) / 100));
const ALERT_STYLE: Record<ReportAlert["level"], { box: string; icon: typeof Info }> = {
    danger: { box: "bg-tone-red-soft text-tone-red-fg", icon: AlertTriangle },
    warning: { box: "bg-tone-amber-soft text-tone-amber-fg", icon: AlertTriangle },
    info: { box: "bg-tone-blue-icon text-tone-blue-fg", icon: Info },
    success: { box: "bg-tone-green-icon text-tone-green-fg", icon: CheckCircle2 },
};

function Delta({ cur, prev }: { cur: number; prev: number }) {
    if (prev <= 0) return <span className="text-xs text-ink-muted">Sin periodo previo</span>;
    const pct = ((cur - prev) / prev) * 100;
    const up = pct >= 0;
    const Icon = up ? TrendingUp : TrendingDown;
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-bold ${up ? "text-tone-green-fg" : "text-tone-red-fg"}`}>
            <Icon className="size-3.5" aria-hidden />{up ? "+" : ""}{pct.toFixed(0)}% <span className="font-normal text-ink-muted">vs. periodo anterior</span>
        </span>
    );
}

function Kpi({ label, value, icon: Icon, tone, foot }: { label: string; value: string; icon: typeof Wallet; tone: string; foot: React.ReactNode }) {
    return (
        <article className="ui-card flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink-muted">{label}</p>
                <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}><Icon className="size-5" aria-hidden /></span>
            </div>
            <p className="text-3xl font-extrabold tracking-tight tabular-nums">{value}</p>
            <div className="min-h-4 text-xs text-ink-muted">{foot}</div>
        </article>
    );
}

export function ReportesView({ report: r }: { report: ReporteData }) {
    const k = r.kpis;
    const occPct = k.capacity ? Math.round((k.occupied / k.capacity) * 100) : 0;
    const bucketLabel = r.range.bucket === "day" ? "por día" : r.range.bucket === "week" ? "por semana" : "por mes";

    return (
        <section className="mx-auto flex max-w-[1500px] flex-col gap-6">
            <PageHeader eyebrow="Administración" title="Reportes y métricas" description={`Del ${r.range.from} al ${r.range.to} (${r.range.days} días).`} />

            <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
                    {PRESETS.map(([n, label]) => (
                        <Link key={n} to={`?rango=${n}`} className={`ui-button inline-flex h-9 items-center rounded-lg px-4 text-xs font-semibold ${r.range.preset === n ? "bg-brand text-on-brand shadow-sm" : "text-ink-muted hover:text-ink"}`}>{label}</Link>
                    ))}
                </div>
                <Form method="get" className="flex flex-wrap items-center gap-2">
                    <input type="date" name="desde" defaultValue={r.range.from} aria-label="Desde" className="ui-field h-10 rounded-xl border border-line bg-bg px-3 text-sm" />
                    <input type="date" name="hasta" defaultValue={r.range.to} aria-label="Hasta" className="ui-field h-10 rounded-xl border border-line bg-bg px-3 text-sm" />
                    <button type="submit" className="ui-button h-10 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand">Aplicar</button>
                </Form>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Kpi label="Ingresos" value={formatMoney(k.revenue)} icon={Wallet} tone="bg-tone-green-icon text-tone-green-fg" foot={<Delta cur={k.revenue} prev={k.revenuePrev} />} />
                <Kpi label="Ventas" value={String(k.sales)} icon={ShoppingCart} tone="bg-tone-orange-icon text-tone-orange-fg" foot={<Delta cur={k.sales} prev={k.salesPrev} />} />
                <Kpi label="Ticket promedio" value={formatMoney(k.avgTicket)} icon={Receipt} tone="bg-tone-purple-icon text-tone-purple-fg" foot={`${k.voided} venta(s) anulada(s)`} />
                <Kpi label="Citas" value={String(k.appointments)} icon={CalendarDays} tone="bg-tone-blue-icon text-tone-blue-fg" foot={<Delta cur={k.appointments} prev={k.appointmentsPrev} />} />
                <Kpi label="Consultas clínicas" value={String(k.consultations)} icon={Stethoscope} tone="bg-tone-orange-icon text-tone-orange-fg" foot="Registradas en el periodo" />
                <Kpi label="Pacientes nuevos" value={String(k.newPatients)} icon={PawPrint} tone="bg-tone-green-icon text-tone-green-fg" foot="Registrados en el periodo" />
                <Kpi label="Vacunas aplicadas" value={String(k.vaccinesApplied)} icon={Syringe} tone="bg-tone-blue-icon text-tone-blue-fg" foot="Aplicadas en el periodo" />
                <Kpi label="Ocupación internamiento" value={`${occPct}%`} icon={BedDouble} tone="bg-tone-purple-icon text-tone-purple-fg" foot={`${k.occupied} de ${k.capacity} habitaciones`} />
            </div>

            <SectionCard title="Resumen de la clínica y alertas" icon={AlertTriangle}>
                <ul className="grid gap-3 lg:grid-cols-2">
                    {r.alerts.map((a, i) => {
                        const { box, icon: Icon } = ALERT_STYLE[a.level];
                        const body = (
                            <>
                                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${box}`}><Icon className="size-5" aria-hidden /></span>
                                <div className="min-w-0"><p className="font-bold">{a.title}</p><p className="truncate text-sm text-ink-muted">{a.detail}</p></div>
                            </>
                        );
                        return (
                            <li key={i}>
                                {a.href ? <Link to={a.href} className="flex items-center gap-3 rounded-xl border border-line p-3 hover:border-brand">{body}</Link>
                                    : <div className="flex items-center gap-3 rounded-xl border border-line p-3">{body}</div>}
                            </li>
                        );
                    })}
                </ul>
            </SectionCard>

            <div className="grid gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <SectionCard title={`Ingresos ${bucketLabel}`} icon={Wallet}>
                        <LineChart labels={r.labels} series={[{ name: "Ingresos (S/)", values: r.revenueSeries }]} ariaLabel="Ingresos en el tiempo" format={(n) => `S/${compact(n)}`} />
                    </SectionCard>
                </div>
                <SectionCard title="Ingresos por canal" icon={ShoppingCart}>
                    <DonutLegend data={r.byChannel} ariaLabel="Ingresos por canal" format={formatMoney} centerLabel="Total" />
                </SectionCard>

                <div className="xl:col-span-2">
                    <SectionCard title={`Citas y consultas ${bucketLabel}`} icon={CalendarDays}>
                        <LineChart labels={r.labels} series={[{ name: "Citas", values: r.appointmentsSeries }, { name: "Consultas", values: r.consultationsSeries }]} ariaLabel="Citas y consultas en el tiempo" format={(n) => String(Math.round(n))} />
                    </SectionCard>
                </div>
                <SectionCard title="Estado de las citas" icon={CalendarDays}>
                    <DonutLegend data={r.apptStatus} ariaLabel="Estado de las citas" centerLabel="citas" />
                </SectionCard>

                <SectionCard title="Métodos de pago" icon={Wallet}><HBarList data={r.byPayment} format={formatMoney} /></SectionCard>
                <SectionCard title="Productos y servicios más vendidos" icon={Receipt}><HBarList data={r.topItems} format={formatMoney} /></SectionCard>
                <SectionCard title="Tipos de atención" icon={Stethoscope}><HBarList data={r.careTypes} /></SectionCard>

                <SectionCard title="Pacientes por especie" icon={PawPrint}><DonutLegend data={r.species} ariaLabel="Pacientes por especie" centerLabel="pacientes" /></SectionCard>
                <SectionCard title="Estado de los pacientes" icon={PawPrint}><DonutLegend data={r.patientStatus} ariaLabel="Estado de los pacientes" centerLabel="registrados" /></SectionCard>
                <SectionCard title="Consultas por veterinario" icon={Stethoscope}><HBarList data={r.byVet} /></SectionCard>

                <SectionCard title="Esquema de vacunación" icon={Syringe}><DonutLegend data={r.vaccination} ariaLabel="Esquema de vacunación" centerLabel="registros" /></SectionCard>
                <SectionCard title="Inventario por tipo" icon={ShoppingCart}><DonutLegend data={r.inventoryByKind} ariaLabel="Inventario por tipo" centerLabel="productos" /></SectionCard>
                <SectionCard title="Salud del inventario" icon={Wallet}>
                    <dl className="grid grid-cols-2 gap-3 text-center">
                        <div className="rounded-xl bg-brand-soft p-3"><dt className="text-xs text-ink-muted">Valor total</dt><dd className="text-lg font-extrabold">{formatMoney(r.inventory.value)}</dd></div>
                        <div className="rounded-xl bg-surface-muted p-3"><dt className="text-xs text-ink-muted">Activos</dt><dd className="text-lg font-extrabold">{r.inventory.products}</dd></div>
                        <div className="rounded-xl bg-tone-amber-soft p-3 text-tone-amber-fg"><dt className="text-xs">Stock bajo</dt><dd className="text-lg font-extrabold">{r.inventory.low}</dd></div>
                        <div className="rounded-xl bg-tone-red-soft p-3 text-tone-red-fg"><dt className="text-xs">Agotados</dt><dd className="text-lg font-extrabold">{r.inventory.out}</dd></div>
                    </dl>
                    <p className="mt-3 text-center text-xs text-ink-muted">{r.inventory.expiring} producto(s) vencen en 30 días</p>
                </SectionCard>
            </div>
        </section>
    );
}