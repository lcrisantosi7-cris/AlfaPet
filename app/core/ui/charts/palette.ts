/** Colores de series; los valores reales viven en app.css (cambian con el modo oscuro). */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export const chartColor = (index: number) => CHART_COLORS[index % CHART_COLORS.length];
