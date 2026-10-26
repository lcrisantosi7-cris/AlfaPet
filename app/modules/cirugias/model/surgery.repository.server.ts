import type { PostgrestError } from "@supabase/supabase-js";
import { AppError, BadRequestError, ConflictError, ForbiddenError } from "~/core/errors/app-error";
import type { SupabaseServerClient } from "~/core/supabase/client.server";
import type { ChecklistInput, NotesInput, ScheduleInput } from "./surgery.schema";
import type {
    SurgeonOption,
    SurgeryDetail,
    SurgeryPatientOption,
    SurgeryRow,
    SurgeryServiceOption,
} from "./surgery.types";

const ROW_COLUMNS =
    "id,scheduled_at,status,consent_signed,fasting_confirmed,price," +
    "patient:patients(name,species),service:services(name),surgeon:profiles!surgeries_surgeon_id_fkey(full_name)";

const toRow = (s: any): SurgeryRow => ({
    id: s.id, scheduledAt: s.scheduled_at, status: s.status, consentSigned: s.consent_signed,
    fastingConfirmed: s.fasting_confirmed, price: Number(s.price),
    patientName: s.patient?.name ?? "Paciente", species: String(s.patient?.species ?? ""),
    procedure: s.service?.name ?? "Procedimiento", surgeonName: s.surgeon?.full_name ?? null,
});

export class SurgeryRepository {
    constructor(private readonly supabase: SupabaseServerClient) { }

    async list(): Promise<SurgeryRow[]> {
        const { data, error } = await this.supabase
            .from("surgeries").select(ROW_COLUMNS).order("scheduled_at", { ascending: false }).limit(300);
        if (error) throw new Response("No se pudo cargar la agenda quirúrgica.", { status: 500 });
        return (data ?? []).map(toRow);
    }

    async getDetail(id: string): Promise<SurgeryDetail | null> {
        const { data, error } = await this.supabase
            .from("surgeries")
            .select(
                ROW_COLUMNS +
                ",pre_op_notes,anesthesia_notes,procedure_notes,post_op_instructions,started_at,ended_at," +
                "patient_full:patients(id,breed,owner:owners(full_name,phone))",
            )
            .eq("id", id)
            .maybeSingle();
        if (error) throw new Response("No se pudo cargar la cirugía.", { status: 500 });
        if (!data) return null;

        const s: any = data;
        return {
            ...toRow(s), patientId: s.patient_full?.id ?? "", breed: s.patient_full?.breed ?? null,
            ownerName: s.patient_full?.owner?.full_name ?? null, ownerPhone: s.patient_full?.owner?.phone ?? null,
            preOpNotes: s.pre_op_notes, anesthesiaNotes: s.anesthesia_notes, procedureNotes: s.procedure_notes,
            postOpInstructions: s.post_op_instructions, startedAt: s.started_at, endedAt: s.ended_at,
        };
    }

    async getPatients(): Promise<SurgeryPatientOption[]> {
        const { data, error } = await this.supabase
            .from("patients").select("id,name,species,owner:owners(full_name)").eq("is_active", true).order("name").limit(1000);
        if (error) throw new Response("No se pudo cargar la lista de pacientes.", { status: 500 });
        return (data ?? []).map((p: any) => ({ id: p.id, name: p.name, species: String(p.species), ownerName: p.owner?.full_name ?? null }));
    }

    async getProcedures(): Promise<SurgeryServiceOption[]> {
        const { data, error } = await this.supabase
            .from("services").select("id,name,base_price").eq("category", "cirugia").eq("is_active", true).order("name");
        if (error) throw new Response("No se pudo cargar el catálogo de cirugías.", { status: 500 });
        return (data ?? []).map((s: any) => ({ id: s.id, name: s.name, price: Number(s.base_price) }));
    }

    async getSurgeons(): Promise<SurgeonOption[]> {
        const { data } = await this.supabase
            .from("profiles").select("id,full_name").eq("role", "veterinario").eq("is_active", true).order("full_name");
        return (data ?? []).map((v: any) => ({ id: v.id, name: v.full_name }));
    }

    async schedule(input: ScheduleInput, surgeonId: string): Promise<void> {
        const { error } = await this.supabase.from("surgeries").insert({
            patient_id: input.patientId, service_id: input.serviceId, surgeon_id: surgeonId,
            scheduled_at: input.scheduledAt.toISOString(), price: input.price, pre_op_notes: input.preOpNotes ?? null,
        });
        if (error) throw SurgeryRepository.toError(error);
    }

    async updateChecklist(input: ChecklistInput): Promise<void> {
        await this.guarded(
            this.supabase.from("surgeries")
                .update({ consent_signed: input.consentSigned, fasting_confirmed: input.fastingConfirmed })
                .eq("id", input.surgeryId).eq("status", "programada").select("id"),
            "Solo se puede editar la lista previa mientras la cirugía está programada.",
        );
    }

    async saveNotes(input: NotesInput): Promise<void> {
        await this.guarded(
            this.supabase.from("surgeries")
                .update({
                    pre_op_notes: input.preOpNotes ?? null, anesthesia_notes: input.anesthesiaNotes ?? null,
                    procedure_notes: input.procedureNotes ?? null, post_op_instructions: input.postOpInstructions ?? null,
                })
                .eq("id", input.surgeryId).neq("status", "cancelada").select("id"),
            "No se pueden editar las notas de una cirugía cancelada.",
        );
    }

    async start(id: string): Promise<void> {
        await this.guarded(
            this.supabase.from("surgeries")
                .update({ status: "en_curso", started_at: new Date().toISOString() })
                .eq("id", id).eq("status", "programada").eq("consent_signed", true).select("id"),
            "No se puede iniciar: falta el consentimiento firmado o la cirugía ya no está programada.",
        );
    }

    async complete(id: string): Promise<void> {
        await this.guarded(
            this.supabase.from("surgeries")
                .update({ status: "completada", ended_at: new Date().toISOString() })
                .eq("id", id).eq("status", "en_curso").select("id"),
            "Solo se puede completar una cirugía que está en curso.",
        );
    }

    async cancel(id: string): Promise<void> {
        await this.guarded(
            this.supabase.from("surgeries").update({ status: "cancelada" }).eq("id", id).eq("status", "programada").select("id"),
            "Solo se puede cancelar una cirugía programada.",
        );
    }

    /** Ejecuta un UPDATE condicional: si no afectó ninguna fila, el estado ya había cambiado. */
    private async guarded(query: PromiseLike<{ data: unknown[] | null; error: PostgrestError | null }>, conflict: string) {
        const { data, error } = await query;
        if (error) throw SurgeryRepository.toError(error);
        if (!data?.length) throw new ConflictError(conflict);
    }

    private static toError(error: PostgrestError): AppError {
        switch (error.code) {
            case "42501":
                return new ForbiddenError("No tienes permiso para esta operación.");
            case "23514":
                return new BadRequestError("Se requiere el consentimiento firmado y datos válidos.");
            case "22P02":
            case "23503":
                return new BadRequestError("Revisa los datos ingresados.");
            default:
                return new AppError("No se pudo completar la operación. Intenta nuevamente.");
        }
    }
}