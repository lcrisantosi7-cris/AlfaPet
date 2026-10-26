export interface RevenuePoint {
    /** "2026-10-24" (día en hora de Lima) */
    date: string;
    total: number;
    count: number;
}

export type AgendaKind = "cita" | "cirugia";

export interface AgendaItem {
    kind: AgendaKind;
    id: string;
    timeLabel: string;
    title: string;
    subtitle: string;
    status: string;
    href: string;
    /** Próximo evento pendiente del día. */
    isNext: boolean;
}

export type AttentionType = "stock" | "surgery_consent" | "vaccine_overdue" | "lab_pending";

export interface AttentionItem {
    type: AttentionType;
    severity: "high" | "medium";
    title: string;
    detail: string;
    href: string;
}

export interface ChannelShare {
    channel: "pet_shop" | "farmacia" | "servicios";
    total: number;
}

export interface AdminOverview {
    revenue: { today: number; yesterday: number; series: RevenuePoint[] };
    channels: ChannelShare[];
    appointments: { total: number; done: number };
    surgeries: { today: number; upcoming: number; inProgress: number };
    admissions: { active: number; capacity: number };
    labPending: number;
    lowStock: number;
    patients: { total: number; new30d: number };
    agenda: AgendaItem[];
    attention: AttentionItem[];
}