import { chartColor } from "./palette";

export interface DonutDatum {
  label: string;
  value: number;
}

interface DonutChartProps {
  data: readonly DonutDatum[];
  ariaLabel: string;
  className?: string;
}

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({ data, ariaLabel, className }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  let offset = 0;

  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={ariaLabel} className={className}>
      <g transform="rotate(-90 50 50)" fill="none" strokeWidth={20}>
        {data.map((d, index) => {
          const length = (d.value / total) * CIRCUMFERENCE;
          const circle = (
            <circle
              key={d.label}
              cx={50}
              cy={50}
              r={RADIUS}
              stroke={chartColor(index)}
              strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
              strokeDashoffset={-offset}
            />
          );
          offset += length;
          return circle;
        })}
      </g>
    </svg>
  );
}
