import type { SupabaseServerClient } from "~/core/supabase/client.server";
import type { AdminOverview, AgendaItem, AgendaKind, AttentionItem, ChannelShare, RevenuePoint } from "./admin-overview.types";

const DONE_STATES = new Set(["completada", "atendida", "completado"]);

const timeFormat = new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Lima",
});

interface RawAgenda { kind: AgendaKind; id: string; at: string; title: string; subtitle: string; status: string }
interface RawOverview {
    revenue: { today: number; yesterday: number; series: RevenuePoint[] };
    channels: ChannelShare[];
    appointments: { total: number; done: number };
    surgeries: { today: number; upcoming: number; inProgress: number };
    admissions: { active: number; capacity: number };
    lab: { pending: number };
    stock: { low: number };
    patients: { total: number; new30d: number };
    agenda: RawAgenda[];
    attention: AttentionItem[];
}

/** Resumen operativo del administrador: una sola llamada al RPC `get_admin_overview`. */
export class AdminOverviewRepository {
    constructor(private readonly supabase: SupabaseServerClient) { }

    /** Devuelve null si la función aún no existe en la base (migración pendiente). */
    async get(): Promise<AdminOverview | null> {
        const { data, error } = await this.supabase.rpc("get_admin_overview");
        if (error) {
            if (error.code === "PGRST202" || error.code === "42883") return null;
            throw new Response("No se pudo cargar el resumen del administrador.", { status: 500 });
        }

        const raw = data as RawOverview;
        return {
            revenue: {
                today: Number(raw.revenue.today),
                yesterday: Number(raw.revenue.yesterday),
                series: raw.revenue.series.map((p) => ({ ...p, total: Number(p.total) })),
            },
            channels: raw.channels.map((c) => ({ ...c, total: Number(c.total) })),
            appointments: raw.appointments,
            surgeries: raw.surgeries,
            admissions: raw.admissions,
            labPending: raw.lab.pending,
            lowStock: raw.stock.low,
            patients: raw.patients,
            agenda: AdminOverviewRepository.toAgenda(raw.agenda),
            attention: raw.attention,
        };
    }

    private static toAgenda(items: RawAgenda[]): AgendaItem[] {
        const now = Date.now();
        let nextAssigned = false;
        return items.map((item) => {
            const pending = !DONE_STATES.has(item.status) && item.status !== "cancelada";
            const isNext = !nextAssigned && pending && new Date(item.at).getTime() >= now - 30 * 60_000;
            if (isNext) nextAssigned = true;
            return {
                kind: item.kind, id: item.id, title: item.title, subtitle: item.subtitle, status: item.status,
                timeLabel: timeFormat.format(new Date(item.at)),
                href: item.kind === "cirugia" ? `/cirugias/${item.id}` : "/citas",
                isNext,
            };
        });
    }
}