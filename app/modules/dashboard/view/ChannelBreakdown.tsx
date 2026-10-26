import { ChartPie } from "lucide-react";
import type { CSSProperties } from "react";
import { formatMoney } from "~/core/lib/format";
import { chartColor } from "~/core/ui/charts/palette";
import { EmptyState } from "~/core/ui/EmptyState";
import { SectionCard } from "~/core/ui/SectionCard";
import type { ChannelShare } from "../model/admin-overview.types";

const LABEL: Record<ChannelShare["channel"], string> = {
    pet_shop: "Pet Shop",
    farmacia: "Farmacia",
    servicios: "Servicios",
};

export function ChannelBreakdown({ channels }: { channels: readonly ChannelShare[] }) {
    const total = channels.reduce((sum, c) => sum + c.total, 0);

    return (
        <SectionCard title="Ventas por canal · 30 días" icon={ChartPie}>
            {total === 0 ? (
                <EmptyState icon={ChartPie} title="Sin ventas en 30 días" description="Cuando registres ventas verás aquí de dónde vienen los ingresos." />
            ) : (
                <>
                    <p className="mb-4 text-2xl font-extrabold tracking-tight tabular-nums">{formatMoney(total)}</p>
                    <ul className="flex flex-col gap-4">
                        {channels.map((channel, index) => {
                            const percent = (channel.total / total) * 100;
                            return (
                                <li key={channel.channel}>
                                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                                        <span className="flex items-center gap-2 font-semibold">
                                            <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: chartColor(index) }} />
                                            {LABEL[channel.channel]}
                                        </span>
                                        <span className="tabular-nums text-ink-muted">
                                            <strong className="text-ink">{formatMoney(channel.total)}</strong> · {percent.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted" role="presentation">
                                        <div
                                            className="bar-grow h-full rounded-full"
                                            style={{ width: `${percent}%`, backgroundColor: chartColor(index), "--i": index } as CSSProperties}
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}
        </SectionCard>
    );
}