import { PawPrint } from "lucide-react";
import { ConfirmForm } from "~/core/feedback/ConfirmForm";
import { DonutChart } from "~/core/ui/charts/DonutChart";
import { chartColor } from "~/core/ui/charts/palette";
import { EmptyState } from "~/core/ui/EmptyState";
import { SectionCard } from "~/core/ui/SectionCard";
import type { CareTypeShare } from "../model/dashboard.types";

export function CareTypesCard({ shares }: { shares: readonly CareTypeShare[] }) {
  const chartData = shares.map((s) => ({ label: s.label, value: s.percent }));

  return (
    <SectionCard title="Tipos de atención (30 días)" icon={PawPrint}>
      {shares.length === 0 ? (
        <EmptyState icon={PawPrint} title="Sin atenciones registradas" />
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-6">
          <DonutChart
            data={chartData}
            ariaLabel="Distribución de tipos de atención"
            className="size-40 shrink-0"
          />
          <ul className="flex min-w-44 flex-1 flex-col gap-2.5 text-sm">
            {shares.map((share, index) => (
              <li key={share.label} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: chartColor(index) }}
                />
                <span className="flex-1">{share.label}</span>
                <span className="text-ink-muted">{share.percent}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}