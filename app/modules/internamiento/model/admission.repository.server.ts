import type { PostgrestError } from "@supabase/supabase-js";
import { AppError, BadRequestError, ConflictError, ForbiddenError } from "~/core/errors/app-error";
import type { SupabaseServerClient } from "~/core/supabase/client.server";
import type { AdmitInput, DischargeInput, NoteInput } from "./admission.schema";
import type {
    AdmissiblePatient,
    AdmissionDetail,
    AdmissionStatus,
    KennelCard,
    VetOption,
} from "./admission.types";

const DAY_MS = 86_400_000;
const dayNumber = (admittedAt: string) => Math.floor((Date.now() - new Date(admittedAt).getTime()) / DAY_MS) + 1;

export class AdmissionRepository {
    constructor(private readonly supabase: SupabaseServerClient) { }

    /** Personal clínico ve el motivo y el veterinario; recepción solo ocupación (vista sin datos clínicos). */
    async getBoard(clinical: boolean): Promise<KennelCard[]> {
        if (!clinical) {
            const { data, error } = await this.supabase
                .from("kennel_occupancy")
                .select("id,code,name,kind,admission_id,patient_name,admitted_at")
                .order("code");
            if (error) throw new Response("No se pudo cargar la ocupación.", { status: 500 });
            return (data ?? []).map((k: any) => ({
                id: k.id, code: k.code, name: k.name, kind: k.kind,
                occupant: k.admission_id
                    ? { admissionId: k.admission_id, patientName: k.patient_name, admittedAt: k.admitted_at, day: dayNumber(k.admitted_at) }
                    : null,
            }));
        }

        const [kennels, admissions] = await Promise.all([
            this.supabase.from("kennels").select("id,code,name,kind").eq("is_active", true).order("code"),
            this.supabase
                .from("admissions")
                .select("id,kennel_id,reason,admitted_at,patient:patients(name),vet:profiles!admissions_vet_id_fkey(full_name)")
                .eq("status", "internado"),
        ]);
        if (kennels.error || admissions.error) throw new Response("No se pudo cargar el tablero.", { status: 500 });

        const byKennel = new Map((admissions.data ?? []).map((a: any) => [a.kennel_id, a]));
        return (kennels.data ?? []).map((k: any) => {
            const a: any = byKennel.get(k.id);
            return {
                id: k.id, code: k.code, name: k.name, kind: k.kind,
                occupant: a
                    ? {
                        admissionId: a.id, patientName: a.patient?.name ?? "Paciente", admittedAt: a.admitted_at,
                        day: dayNumber(a.admitted_at), reason: a.reason, vetName: a.vet?.full_name ?? null,
                    }
                    : null,
            };
        });
    }

    async getAdmissiblePatients(): Promise<AdmissiblePatient[]> {
        const [patients, active] = await Promise.all([
            this.supabase.from("patients").select("id,name,species,owner:owners(full_name)").eq("is_active", true).order("name").limit(1000),
            this.supabase.from("admissions").select("patient_id").eq("status", "internado"),
        ]);
        if (patients.error || active.error) throw new Response("No se pudo cargar la lista de pacientes.", { status: 500 });

        const admitted = new Set((active.data ?? []).map((a: any) => a.patient_id));
        return (patients.data ?? [])
            .filter((p: any) => !admitted.has(p.id))
            .map((p: any) => ({ id: p.id, name: p.name, species: String(p.species), ownerName: p.owner?.full_name ?? null }));
    }

    async getVets(): Promise<VetOption[]> {
        const { data } = await this.supabase
            .from("profiles").select("id,full_name").eq("role", "veterinario").eq("is_active", true).order("full_name");
        return (data ?? []).map((v: any) => ({ id: v.id, name: v.full_name }));
    }

    async getDefaultRate(): Promise<number> {
        const { data } = await this.supabase
            .from("services").select("base_price").eq("code", "internamiento-dia").maybeSingle<{ base_price: number }>();
        return Number(data?.base_price ?? 0);
    }

    async getDetail(id: string): Promise<AdmissionDetail | null> {
        const { data, error } = await this.supabase
            .from("admissions")
            .select(
                "id,status,reason,diagnosis,admitted_at,discharged_at,discharge_notes,daily_rate," +
                "kennel:kennels(code,name),patient:patients(id,name,species,breed,owner:owners(full_name,phone))," +
                "vet:profiles!admissions_vet_id_fkey(full_name)," +
                "notes:admission_notes(id,note,weight_kg,temperature_c,created_at,author:profiles!admission_notes_author_id_fkey(full_name))",
            )
            .eq("id", id)
            .order("created_at", { referencedTable: "admission_notes", ascending: false })
            .maybeSingle();
        if (error) throw new Response("No se pudo cargar el internamiento.", { status: 500 });
        if (!data) return null;

        const a: any = data;
        return {
            id: a.id, status: a.status, reason: a.reason, diagnosis: a.diagnosis, admittedAt: a.admitted_at,
            dischargedAt: a.discharged_at, dischargeNotes: a.discharge_notes, dailyRate: Number(a.daily_rate),
            day: dayNumber(a.admitted_at), kennel: a.kennel,
            patient: { id: a.patient.id, name: a.patient.name, species: String(a.patient.species), breed: a.patient.breed },
            ownerName: a.patient.owner?.full_name ?? null, ownerPhone: a.patient.owner?.phone ?? null,
            vetName: a.vet?.full_name ?? null,
            notes: (a.notes ?? []).map((n: any) => ({
                id: n.id, note: n.note, weightKg: n.weight_kg === null ? null : Number(n.weight_kg),
                temperatureC: n.temperature_c === null ? null : Number(n.temperature_c),
                authorName: n.author?.full_name ?? null, createdAt: n.created_at,
            })),
        };
    }

    async getStatus(id: string): Promise<AdmissionStatus | null> {
        const { data } = await this.supabase.from("admissions").select("status").eq("id", id).maybeSingle<{ status: AdmissionStatus }>();
        return data?.status ?? null;
    }

    async admit(input: AdmitInput, vetId: string): Promise<void> {
        const { error } = await this.supabase.from("admissions").insert({
            patient_id: input.patientId, kennel_id: input.kennelId, vet_id: vetId, reason: input.reason,
            diagnosis: input.diagnosis ?? null, daily_rate: input.dailyRate,
        });
        if (error) throw AdmissionRepository.toError(error);
    }

    async addNote(input: NoteInput): Promise<void> {
        const { error } = await this.supabase.from("admission_notes").insert({
            admission_id: input.admissionId, note: input.note,
            weight_kg: input.weightKg ?? null, temperature_c: input.temperatureC ?? null,
        });
        if (error) throw AdmissionRepository.toError(error);
    }

    async discharge(input: DischargeInput): Promise<void> {
        const { data, error } = await this.supabase
            .from("admissions")
            .update({ status: input.outcome, discharged_at: new Date().toISOString(), discharge_notes: input.notes ?? null })
            .eq("id", input.admissionId)
            .eq("status", "internado")
            .select("id");
        if (error) throw AdmissionRepository.toError(error);
        if (!data?.length) throw new ConflictError("Este internamiento ya fue cerrado o no existe.");
    }

    private static toError(error: PostgrestError): AppError {
        switch (error.code) {
            case "23505":
                return new ConflictError("El paciente ya está internado o la jaula está ocupada.");
            case "42501":
                return new ForbiddenError("No tienes permiso para esta operación.");
            case "23514":
            case "22P02":
            case "23503":
                return new BadRequestError("Revisa los datos ingresados.");
            default:
                return new AppError("No se pudo completar la operación. Intenta nuevamente.");
        }
    }
}