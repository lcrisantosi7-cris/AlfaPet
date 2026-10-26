import type { SupabaseServerClient } from "~/core/supabase/client.server";
import type { HistorialPatient, HistorialRow, TimelineItem } from "./historial.types";

const one = (v: any) => (Array.isArray(v) ? v[0] : v);

export class HistorialRepository {
    constructor(private readonly supabase: SupabaseServerClient) { }

    /** Una fila por paciente: dueño, mascota, estado de atención y veterinario. */
    async listPatients(): Promise<HistorialRow[]> {
        const [pats, appts] = await Promise.all([
            this.supabase.from("patients").select("id,name,species,life_status,owner:owners(full_name,phone)").order("created_at", { ascending: false }).limit(500),
            this.supabase.from("appointments").select("patient_id,status,starts_at,vet:profiles!appointments_vet_id_fkey(full_name)").order("starts_at", { ascending: false }).limit(3000),
        ]);
        if (pats.error) throw new Response("No se pudo cargar el historial clínico.", { status: 500 });

        const now = Date.now();
        const byPatient = new Map<string, any[]>();
        for (const a of appts.data ?? []) {
            const list = byPatient.get(a.patient_id) ?? [];
            list.push(a);
            byPatient.set(a.patient_id, list);
        }

        return (pats.data ?? []).map((p: any) => {
            const list = byPatient.get(p.id) ?? [];
            const upcoming = list
                .filter((a) => ["pendiente", "confirmada"].includes(a.status) && new Date(a.starts_at).getTime() >= now)
                .sort((x, y) => +new Date(x.starts_at) - +new Date(y.starts_at))[0];
            const last = list[0];
            const ref = upcoming ?? last;

            let stateLabel = "Sin atenciones"; let stateVariant: HistorialRow["stateVariant"] = "neutral";
            if (p.life_status === "fallecido") stateLabel = "Fallecido";
            else if (upcoming) { stateLabel = "Por atender"; stateVariant = "info"; }
            else if (last?.status === "completada") { stateLabel = "Atendido"; stateVariant = "success"; }
            else if (last?.status === "cancelada") { stateLabel = "Cancelada"; stateVariant = "danger"; }
            else if (last) { stateLabel = "Fecha expirada"; stateVariant = "danger"; }

            return {
                id: p.id, name: p.name, species: String(p.species ?? ""), ownerName: one(p.owner)?.full_name ?? null,
                ownerPhone: one(p.owner)?.phone ?? null, stateLabel, stateVariant, vetName: one(ref?.vet)?.full_name ?? "Sin designar",
            };
        });
    }

    async getPatient(id: string): Promise<HistorialPatient | null> {
        const { data: p } = await this.supabase.from("patients").select("id,name,species,breed,is_active,life_status,owner:owners(full_name,phone)").eq("id", id).maybeSingle();
        if (!p) return null;
        return {
            id: p.id, name: p.name, species: String(p.species ?? ""), breed: p.breed, ownerName: one((p as any).owner)?.full_name ?? null,
            ownerPhone: one((p as any).owner)?.phone ?? null, lifeStatus: p.life_status ?? "vivo", isActive: Boolean(p.is_active),
        };
    }

    async timeline(patientId: string): Promise<TimelineItem[]> {
        const { data } = await this.supabase.from("clinical_history").select("occurred_at,record_type,title,detail,status,author_name,source_table,source_id").eq("patient_id", patientId).order("occurred_at", { ascending: false }).limit(300);
        return (data ?? []).map((r: any) => ({
            occurredAt: r.occurred_at, type: r.record_type, title: r.title, detail: r.detail, status: r.status,
            author: r.author_name, sourceTable: r.source_table, sourceId: r.source_id,
        }));
    }
}