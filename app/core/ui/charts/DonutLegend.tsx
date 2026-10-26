import { DonutChart, type DonutDatum } from "./DonutChart";
import { chartColor } from "./palette";

interface Props { data: readonly DonutDatum[]; ariaLabel: string; format?: (n: number) => string; centerLabel?: string }

/** Torta con total al centro y leyenda con porcentajes. */
export function DonutLegend({ data, ariaLabel, format = String, centerLabel }: Props) {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return <p className="py-10 text-center text-sm text-ink-muted">Sin datos en este periodo.</p>;
    return (
        <div className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="relative size-40 shrink-0">
                <DonutChart data={data} ariaLabel={ariaLabel} className="size-full" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-lg font-extrabold tabular-nums leading-tight">{format(total)}</span>
                    {centerLabel && <span className="text-[11px] text-ink-muted">{centerLabel}</span>}
                </div>
            </div>
            <ul className="flex w-full flex-col gap-2 text-sm">
                {data.map((d, i) => (
                    <li key={d.label} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2"><span className="size-3 rounded-full" style={{ background: chartColor(i) }} />{d.label}</span>
                        <span className="font-semibold tabular-nums">{format(d.value)} <span className="text-xs font-normal text-ink-muted">({Math.round((d.value / total) * 100)}%)</span></span>
                    </li>
                ))}
            </ul>
        </div>
    );
}