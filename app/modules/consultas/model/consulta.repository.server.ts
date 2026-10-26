import { BadRequestError } from "~/core/errors/app-error";
import type { SupabaseServerClient } from "~/core/supabase/client.server";
import type { ConsultaInput, ConsultaUpdateInput } from "./consulta.schema";
import type { AppointmentOption, ConsultaDetail, ConsultaRow, PatientOption } from "./consulta.types";

/** Minutos de tolerancia para registrar la consulta de una cita ya iniciada. */
export const APPOINTMENT_GRACE_MIN = 60;

const one = (v: any) => (Array.isArray(v) ? v[0] : v);
const when = (iso: string) => new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(iso));

export class ConsultaRepository {
    constructor(private readonly supabase: SupabaseServerClient) { }

    private static base(c: any): ConsultaRow {
        const patient = one(c.patient);
        const appt = one(c.appointment);
        return {
            id: c.id, createdAt: c.created_at, patientId: patient?.id, patientName: patient?.name ?? "Paciente",
            species: String(patient?.species ?? ""), ownerName: one(patient?.owner)?.full_name ?? null,
            vetName: one(c.vet)?.full_name ?? null, weightKg: c.weight_kg ?? null,
            appointmentLabel: appt ? `${when(appt.starts_at)} · ${one(appt.care_type)?.label ?? "Atención"}` : null,
        };
    }

    async list(): Promise<ConsultaRow[]> {
        const { data, error } = await this.supabase
            .from("consultations")
            .select("id,created_at,weight_kg,patient:patients(id,name,species,owner:owners(full_name)),vet:profiles!consultations_vet_id_fkey(full_name),appointment:appointments(starts_at,care_type:care_types(label))")
            .order("created_at", { ascending: false })
            .limit(300);
        if (error) throw new Response("No se pudieron cargar las consultas.", { status: 500 });
        return (data ?? []).map(ConsultaRepository.base);
    }

    /** Solo pacientes vivos/activos y citas pendientes o confirmadas que aún no pasaron. */
    async formOptions(): Promise<{ patients: PatientOption[]; appointments: AppointmentOption[] }> {
        const since = new Date(Date.now() - APPOINTMENT_GRACE_MIN * 60000).toISOString();
        const [p, a] = await Promise.all([
            this.supabase.from("patients").select("id,name,current_weight_kg,owner:owners(full_name)").eq("is_active", true).eq("life_status", "vivo").order("name").limit(500),
            this.supabase.from("appointments").select("id,patient_id,starts_at,care_type:care_types(label)").in("status", ["pendiente", "confirmada"]).gte("starts_at", since).order("starts_at").limit(500),
        ]);
        return {
            patients: (p.data ?? []).map((x: any) => ({ id: x.id, name: x.name, ownerName: one(x.owner)?.full_name ?? null, currentWeightKg: x.current_weight_kg })),
            appointments: (a.data ?? []).map((x: any) => ({ id: x.id, patientId: x.patient_id, label: `${when(x.starts_at)} · ${one(x.care_type)?.label ?? "Atención"}` })),
        };
    }

    async getDetail(id: string): Promise<ConsultaDetail | null> {
        const { data: c } = await this.supabase
            .from("consultations")
            .select("id,created_at,weight_kg,temperature_c,symptoms,diagnosis,treatment,notes,patient:patients(id,name,species,breed,current_weight_kg,owner:owners(full_name,phone)),vet:profiles!consultations_vet_id_fkey(full_name),appointment:appointments(starts_at,care_type:care_types(label))")
            .eq("id", id)
            .maybeSingle();
        if (!c) return null;
        const patient = one((c as any).patient);
        const appt = one((c as any).appointment);
        return {
            ...ConsultaRepository.base(c),
            temperatureC: c.temperature_c, symptoms: c.symptoms, diagnosis: c.diagnosis, treatment: c.treatment, notes: c.notes,
            careType: one(appt?.care_type)?.label ?? null, currentWeightKg: patient?.current_weight_kg ?? null,
            ownerPhone: one(patient?.owner)?.phone ?? null, breed: patient?.breed ?? null,
        };
    }

    async create(input: ConsultaInput, vetId: string): Promise<string> {
        if (input.appointmentId) {
            const { data: appt } = await this.supabase.from("appointments").select("id,patient_id,status,starts_at").eq("id", input.appointmentId).maybeSingle();
            const minTime = Date.now() - APPOINTMENT_GRACE_MIN * 60000;
            if (!appt || appt.patient_id !== input.patientId) throw new BadRequestError("La cita no pertenece al paciente seleccionado.");
            if (!["pendiente", "confirmada"].includes(appt.status)) throw new BadRequestError("Solo puedes relacionar citas pendientes.");
            if (new Date(appt.starts_at).getTime() < minTime) throw new BadRequestError("Esa cita ya pasó. Elige una cita vigente o registra sin cita.");
        }
        const { data, error } = await this.supabase.from("consultations").insert({
            patient_id: input.patientId, appointment_id: input.appointmentId ?? null, vet_id: vetId,
            weight_kg: input.weightKg ?? null, temperature_c: input.temperatureC ?? null,
            symptoms: input.symptoms ?? null, diagnosis: input.diagnosis, treatment: input.treatment ?? null, notes: input.notes ?? null,
        }).select("id").single();
        if (error) throw new BadRequestError("No se pudo guardar la consulta. Revisa los datos.");

        if (input.appointmentId) {
            // La cita queda atendida; si no tenía veterinario, queda a nombre de quien atendió.
            await this.supabase.from("appointments").update({ status: "completada" }).eq("id", input.appointmentId);
        }
        return data.id as string;
    }

    async update(id: string, v: ConsultaUpdateInput): Promise<void> {
        const { error } = await this.supabase.from("consultations").update({
            weight_kg: v.weightKg ?? null, temperature_c: v.temperatureC ?? null, symptoms: v.symptoms ?? null,
            diagnosis: v.diagnosis, treatment: v.treatment ?? null, notes: v.notes ?? null,
        }).eq("id", id);
        if (error) throw new BadRequestError("No se pudo actualizar la consulta.");
    }
}