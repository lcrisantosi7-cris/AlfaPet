import type { BadgeVariant } from "~/core/ui/Badge";

export interface HistorialRow {
    id: string; name: string; species: string; ownerName: string | null; ownerPhone: string | null;
    stateLabel: string; stateVariant: BadgeVariant; vetName: string;
}
export interface TimelineItem {
    occurredAt: string; type: string; title: string; detail: string | null; status: string | null;
    author: string | null; sourceTable: string; sourceId: string;
}
export interface HistorialPatient { id: string; name: string; species: string; breed: string | null; ownerName: string | null; ownerPhone: string | null; lifeStatus: string; isActive: boolean }