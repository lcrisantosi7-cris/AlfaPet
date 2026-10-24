import { capitalize } from "~/core/lib/format";
import { LimaTime } from "~/core/lib/lima-time";
import type { SupabaseServerClient } from "~/core/supabase/client.server";
import type { VetAgenda, VetAgendaAppointment } from "./dashboard.types";

type RawRelation<T> = T | T[] | null;

interface RawVetAgendaAppointment {
    id: string;
    starts_at: string;
    status: string;
    patient: RawRelation<{
        name: string | null;
        species: string | null;
        owner: RawRelation<{ full_name: string | null }>;
    }>;
    care_type: RawRelation<{ label: string | null }>;
}

function firstRelation<T>(value: RawRelation<T> | undefined): T | undefined {
    return (Array.isArray(value) ? value[0] : value) ?? undefined;
}

/** Acceso de datos para la agenda diaria del veterinario. */
export class SupabaseVetAgendaRepository {
    constructor(private readonly supabase: SupabaseServerClient) { }

    async getVetAgenda(vetId: string): Promise<VetAgenda> {
        const { startAt, endAt } = LimaTime.dayBounds();
        const select = "id,starts_at,status,patient:patients(name,species,owner:owners(full_name)),care_type:care_types(label)";
        const [assignedResult, unassignedResult] = await Promise.all([
            this.supabase
                .from("appointments")
                .select(select)
                .eq("vet_id", vetId)
                .gte("starts_at", startAt)
                .lt("starts_at", endAt)
                .neq("status", "cancelada")
                .neq("status", "completada")
                .order("starts_at", { ascending: true })
                .limit(100),
            this.supabase
                .from("appointments")
                .select(select)
                .is("vet_id", null)
                .eq("status", "pendiente")
                .gte("starts_at", new Date().toISOString())
                .order("starts_at", { ascending: true })
                .limit(100),
        ]);

        if (assignedResult.error || unassignedResult.error) {
            throw new Response("No se pudo cargar la agenda del veterinario.", { status: 500 });
        }

        return {
            assigned: ((assignedResult.data ?? []) as unknown as RawVetAgendaAppointment[])
                .map(SupabaseVetAgendaRepository.toVetAgendaAppointment),
            unassigned: ((unassignedResult.data ?? []) as unknown as RawVetAgendaAppointment[])
                .map(SupabaseVetAgendaRepository.toVetAgendaAppointment),
        };
    }

    private static toVetAgendaAppointment(row: RawVetAgendaAppointment): VetAgendaAppointment {
        const patient = firstRelation(row.patient);
        const owner = firstRelation(patient?.owner);
        const careType = firstRelation(row.care_type);

        return {
            id: row.id,
            startsAt: row.starts_at,
            scheduleLabel: LimaTime.scheduleLabel(row.starts_at),
            status: row.status,
            petName: patient?.name?.trim() || "Paciente sin nombre",
            species: capitalize(patient?.species?.trim() || "Mascota"),
            ownerName: owner?.full_name?.trim() || "Responsable no registrado",
            careType: careType?.label?.trim() || "Atención veterinaria",
        };
    }

}