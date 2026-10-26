import { chartColor } from "./palette";

export interface HBarDatum { label: string; value: number }

export function HBarList({ data, format = String }: { data: readonly HBarDatum[]; format?: (n: number) => string }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    if (data.length === 0 || data.every((d) => d.value === 0)) {
        return <p className="py-10 text-center text-sm text-ink-muted">Sin datos en este periodo.</p>;
    }
    return (
        <ul className="flex flex-col gap-3.5">
            {data.map((d, i) => (
                <li key={d.label}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate font-medium">{d.label}</span>
                        <span className="shrink-0 font-bold tabular-nums">{format(d.value)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
                        <div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: chartColor(i) }} />
                    </div>
                </li>
            ))}
        </ul>
    );
}