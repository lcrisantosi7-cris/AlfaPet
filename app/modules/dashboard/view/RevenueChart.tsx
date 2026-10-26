import { Wallet } from "lucide-react";
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { formatMoney } from "~/core/lib/format";
import { SectionCard } from "~/core/ui/SectionCard";
import type { RevenuePoint } from "../model/admin-overview.types";

const W = 640;
const H = 236;
const PAD = { left: 46, right: 14, top: 16, bottom: 32 };

const longDay = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });
const shortDay = new Intl.DateTimeFormat("es-PE", { weekday: "short", timeZone: "UTC" });
const dayNumber = new Intl.DateTimeFormat("es-PE", { day: "numeric", timeZone: "UTC" });
const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

const compact = (n: number) => (n >= 1000 ? `S/ ${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : `S/ ${Math.round(n)}`);

/** Redondea hacia arriba a 1, 2, 5 × 10ⁿ para que la escala sea legible. */
function niceMax(value: number) {
    if (value <= 0) return 100;
    const pow = 10 ** Math.floor(Math.log10(value));
    const n = value / pow;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

/** Curva suave (Catmull-Rom → Bézier) con los puntos de control dentro del área del gráfico. */
function smoothPath(points: readonly (readonly [number, number])[], top: number, bottom: number) {
    const clamp = (y: number) => Math.min(Math.max(y, top), bottom);
    let path = `M${points[0]![0].toFixed(1)},${points[0]![1].toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] ?? points[i]!;
        const p1 = points[i]!;
        const p2 = points[i + 1]!;
        const p3 = points[i + 2] ?? p2;
        const t = 0.18;
        path += ` C${(p1[0] + (p2[0] - p0[0]) * t).toFixed(1)},${clamp(p1[1] + (p2[1] - p0[1]) * t).toFixed(1)}` +
            ` ${(p2[0] - (p3[0] - p1[0]) * t).toFixed(1)},${clamp(p2[1] - (p3[1] - p1[1]) * t).toFixed(1)}` +
            ` ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return path;
}

export function RevenueChart({ series }: { series: readonly RevenuePoint[] }) {
    const gradientId = useId();
    const [active, setActive] = useState(series.length - 1);

    const chart = useMemo(() => {
        const max = niceMax(Math.max(...series.map((p) => p.total), 0));
        const plotW = W - PAD.left - PAD.right;
        const plotH = H - PAD.top - PAD.bottom;
        const baseline = PAD.top + plotH;
        const step = plotW / Math.max(series.length - 1, 1);
        const points = series.map((p, i) => [PAD.left + i * step, PAD.top + (1 - p.total / max) * plotH] as const);
        const line = smoothPath(points, PAD.top, baseline);
        const area = `${line} L${points.at(-1)![0].toFixed(1)},${baseline} L${points[0]![0].toFixed(1)},${baseline} Z`;
        return { max, baseline, step, points, line, area, ticks: [0, max / 2, max] };
    }, [series]);

    const total = series.reduce((sum, p) => sum + p.total, 0);
    const best = series.reduce((a, b) => (b.total > a.total ? b : a), series[0]!);
    const current = series[active]!;
    const activePoint = chart.points[active]!;

    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "ArrowRight") setActive((i) => Math.min(i + 1, series.length - 1));
        else if (event.key === "ArrowLeft") setActive((i) => Math.max(i - 1, 0));
        else return;
        event.preventDefault();
    };

    return (
        <SectionCard title="Ingresos · últimos 14 días" icon={Wallet}>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                <div>
                    <p className="text-2xl font-extrabold tracking-tight tabular-nums">{formatMoney(total)}</p>
                    <p className="text-xs text-ink-muted">
                        Promedio {formatMoney(total / series.length)} por día · mejor día {formatMoney(best.total)}
                    </p>
                </div>
                <p aria-live="polite" className="rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-text tabular-nums">
                    <span className="capitalize">{longDay.format(asDate(current.date))}</span> · {formatMoney(current.total)} · {current.count} {current.count === 1 ? "venta" : "ventas"}
                </p>
            </div>

            <div
                tabIndex={0}
                onKeyDown={onKeyDown}
                role="group"
                aria-label="Ingresos diarios. Usa las flechas izquierda y derecha para recorrer los días."
                className="rounded-xl outline-offset-2 focus-visible:outline-2 focus-visible:outline-brand"
            >
                <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Ingresos de los últimos ${series.length} días: ${formatMoney(total)} en total.`}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity=".32" />
                            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {chart.ticks.map((tick) => {
                        const y = PAD.top + (1 - tick / chart.max) * (chart.baseline - PAD.top);
                        return (
                            <g key={tick}>
                                <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="var(--line)" strokeDasharray={tick === 0 ? undefined : "3 5"} />
                                <text x={PAD.left - 8} y={y + 3.5} textAnchor="end" className="fill-ink-muted text-[10px]">{compact(tick)}</text>
                            </g>
                        );
                    })}

                    <path d={chart.area} fill={`url(#${gradientId})`} className="chart-area" />
                    <path d={chart.line} pathLength={1} className="chart-line" fill="none" stroke="var(--chart-1)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />

                    <line x1={activePoint[0]} x2={activePoint[0]} y1={PAD.top} y2={chart.baseline} stroke="var(--brand)" strokeOpacity=".35" strokeDasharray="3 4" className="chart-guide" />
                    <circle cx={activePoint[0]} cy={activePoint[1]} r="9" fill="var(--brand)" opacity=".16" className="chart-dot" />
                    <circle cx={activePoint[0]} cy={activePoint[1]} r="4.5" fill="var(--surface)" stroke="var(--brand)" strokeWidth="2.5" className="chart-dot" />

                    {series.map((p, i) => (
                        <g key={p.date}>
                            {(i % 2 === 1 || i === series.length - 1) && (
                                <text x={chart.points[i]![0]} y={H - 10} textAnchor="middle" className={i === active ? "fill-brand-text text-[10px] font-bold" : "fill-ink-muted text-[10px]"}>
                                    {shortDay.format(asDate(p.date))} {dayNumber.format(asDate(p.date))}
                                </text>
                            )}
                            <rect
                                x={chart.points[i]![0] - chart.step / 2} y={PAD.top} width={chart.step} height={chart.baseline - PAD.top}
                                fill="transparent" onMouseEnter={() => setActive(i)} onClick={() => setActive(i)}
                            />
                        </g>
                    ))}
                </svg>
            </div>
        </SectionCard>
    );
}