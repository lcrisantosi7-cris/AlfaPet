import { chartColor } from "./palette";

export interface LineSeries { name: string; values: readonly number[] }

interface Props {
    labels: readonly string[];
    series: readonly LineSeries[];
    ariaLabel: string;
    format?: (n: number) => string;
    area?: boolean;
}

const W = 640, H = 240, L = 52, R = 14, T = 14, B = 30;

function niceMax(peak: number) {
    if (peak <= 0) return 4;
    const exp = 10 ** Math.floor(Math.log10(peak));
    const f = peak / exp;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * exp;
}

/** Gráfico de líneas SVG (varias series, área opcional, tooltips nativos). */
export function LineChart({ labels, series, ariaLabel, format = String, area = true }: Props) {
    const n = labels.length;
    const max = niceMax(Math.max(...series.flatMap((s) => s.values), 0));
    const ticks = [0, 1, 2, 3, 4].map((i) => (max * i) / 4);
    const x = (i: number) => L + (n <= 1 ? (W - L - R) / 2 : (i / (n - 1)) * (W - L - R));
    const y = (v: number) => T + (1 - v / max) * (H - T - B);
    const every = Math.max(1, Math.ceil(n / 8));

    return (
        <div>
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="h-auto w-full">
                {ticks.map((t) => (
                    <g key={t}>
                        <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} />
                        <text x={L - 8} y={y(t) + 4} textAnchor="end" className="fill-ink-muted text-[10px]">{format(t)}</text>
                    </g>
                ))}
                {labels.map((label, i) => (i % every === 0 ? (
                    <text key={`${label}-${i}`} x={x(i)} y={H - 8} textAnchor="middle" className="fill-ink-muted text-[10px]">{label}</text>
                ) : null))}
                {series.map((s, si) => {
                    const pts = s.values.map((v, i) => [x(i), y(v)] as const);
                    const line = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
                    const color = chartColor(si);
                    return (
                        <g key={s.name}>
                            {area && si === 0 && pts.length > 1 && (
                                <path d={`${line} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={color} opacity={0.12} />
                            )}
                            <path d={line} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                            {n <= 31 && pts.map(([px, py], i) => (
                                <circle key={i} cx={px} cy={py} r={3.2} fill={color} stroke="var(--color-surface)" strokeWidth={1.5}>
                                    <title>{`${s.name} · ${labels[i]}: ${format(s.values[i] ?? 0)}`}</title>
                                </circle>
                            ))}
                        </g>
                    );
                })}
            </svg>
            {series.length > 1 && (
                <ul className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-ink-muted">
                    {series.map((s, i) => (
                        <li key={s.name} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: chartColor(i) }} />{s.name}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}