export interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: readonly BarDatum[];
  /** Separación entre líneas de la escala; si se omite se calcula según el valor máximo. */
  step?: number;
  ariaLabel: string;
}

const niceStep = (peak: number) => (peak <= 5 ? 1 : peak <= 20 ? 5 : 10);

/** Gráfico de barras en HTML/CSS puro (sin librerías externas). */
export function BarChart({ data, step: stepProp, ariaLabel }: BarChartProps) {
  const peak = Math.max(...data.map((d) => d.value), 1);
  const step = stepProp ?? niceStep(peak);
  const max = Math.ceil(peak / step) * step;
  const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step);
  const columns = { gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` };

  return (
    <div role="img" aria-label={ariaLabel} className="flex gap-3 text-xs text-ink-muted">
      <div className="relative -mt-2 mb-6 w-6 shrink-0">
        {ticks.map((tick) => (
          <span
            key={tick}
            className="absolute right-0 translate-y-1/2 leading-none"
            style={{ bottom: `${(tick / max) * 100}%` }}
          >
            {tick}
          </span>
        ))}
      </div>

      <div className="flex-1">
        <div className="relative h-48">
          {ticks.map((tick) => (
            <div
              key={tick}
              className="absolute inset-x-0 border-t border-line"
              style={{ bottom: `${(tick / max) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 grid items-end" style={columns}>
            {data.map((d) => (
              <div key={d.label} className="flex justify-center">
                <div
                  className="w-6 rounded-t-md bg-chart-1 sm:w-8"
                  style={{ height: `${(d.value / max) * 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 grid text-center" style={columns}>
          {data.map((d) => (
            <span key={d.label}>{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}