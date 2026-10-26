/** Mini gráfico de tendencia (decorativo). Hereda el color con `currentColor`. */
export function Sparkline({ values, className }: { values: readonly number[]; className?: string }) {
    if (values.length < 2) return null;

    const width = 100;
    const height = 32;
    const pad = 2;
    const max = Math.max(...values, 1);
    const points = values.map((value, index) => [
        (index / (values.length - 1)) * width,
        height - pad - (value / max) * (height - pad * 2),
    ]);
    const line = points.map(([x, y], index) => `${index ? "L" : "M"}${x!.toFixed(2)},${y!.toFixed(2)}`).join(" ");

    return (
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden className={className}>
            <path d={`${line} L${width},${height} L0,${height} Z`} className="chart-area" fill="currentColor" opacity=".12" />
            <path
                d={line}
                pathLength={1}
                className="chart-line"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}