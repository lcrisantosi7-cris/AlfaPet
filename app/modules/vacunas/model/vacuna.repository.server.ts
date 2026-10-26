import { BadRequestError, NotFoundError } from "~/core/errors/app-error";
import type { SupabaseServerClient } from "~/core/supabase/client.server";
import type { VaccinationCreateInput, VaccinationUpdateInput } from "./vacuna.schema";
import type { VaccinationRow, VaccinePatientOption, VaccineOption } from "./vacuna.types";
import { addDays, limaToday } from "./vacuna-dates";

const one = (v: any) => (Array.isArray(v) ? v[0] : v);

export class VacunaRepository {
    constructor(private readonly supabase: SupabaseServerClient) { }

    /** Los pacientes fallecidos no conservan vacunas pendientes; sí su historial de aplicadas. */
    async list(): Promise<VaccinationRow[]> {
        const { data, error } = await this.supabase
            .from("vaccinations")
            .select("id,due_date,applied_at,lot,notes,patient:patients(id,name,species,life_status,owner:owners(full_name)),vaccine:vaccines(id,name),by:profiles!vaccinations_administered_by_fkey(full_name)")
            .order("due_date", { ascending: true })
            .limit(500);
        if (error) throw new Response("No se pudieron cargar las vacunas.", { status: 500 });

        return (data ?? [])
            .filter((v: any) => !(one(v.patient)?.life_status === "fallecido" && !v.applied_at))
            .map((v: any) => {
                const p = one(v.patient);
                return {
                    id: v.id, dueDate: v.due_date, appliedAt: v.applied_at, lot: v.lot, notes: v.notes,
                    patientId: p?.id, patientName: p?.name ?? "Paciente", species: String(p?.species ?? ""),
                    ownerName: one(p?.owner)?.full_name ?? null, vaccineId: one(v.vaccine)?.id, vaccineName: one(v.vaccine)?.name ?? "Vacuna",
                    byName: one(v.by)?.full_name ?? null,
                };
            });
    }

    async options(): Promise<{ patients: VaccinePatientOption[]; vaccines: VaccineOption[] }> {
        const [p, v] = await Promise.all([
            this.supabase.from("patients").select("id,name,owner:owners(full_name)").eq("is_active", true).eq("life_status", "vivo").order("name").limit(500),
            this.supabase.from("vaccines").select("id,name,interval_days").eq("is_active", true).order("name"),
        ]);
        return {
            patients: (p.data ?? []).map((x: any) => ({ id: x.id, name: x.name, ownerName: one(x.owner)?.full_name ?? null })),
            vaccines: (v.data ?? []).map((x: any) => ({ id: x.id, name: x.name, intervalDays: x.interval_days })),
        };
    }

    async create(input: VaccinationCreateInput, userId: string): Promise<void> {
        const { data: patient } = await this.supabase.from("patients").select("id,is_active,life_status").eq("id", input.patientId).maybeSingle();
        if (!patient || !patient.is_active || patient.life_status !== "vivo") {
            throw new BadRequestError("No se puede vacunar a un paciente fallecido o inactivo.");
        }
        const { error } = await this.supabase.from("vaccinations").insert({
            patient_id: input.patientId, vaccine_id: input.vaccineId, due_date: input.dueDate,
            applied_at: input.appliedAt ?? null, lot: input.lot ?? null, notes: input.notes ?? null,
            administered_by: input.appliedAt ? userId : null,
        });
        if (error) throw new BadRequestError("No se pudo registrar la vacuna. Revisa los datos.");
    }

    async update(id: string, v: VaccinationUpdateInput, userId: string): Promise<void> {
        const { error } = await this.supabase.from("vaccinations").update({
            due_date: v.dueDate, applied_at: v.appliedAt ?? null, lot: v.lot ?? null, notes: v.notes ?? null,
            ...(v.appliedAt ? { administered_by: userId } : {}),
        }).eq("id", id);
        if (error) throw new BadRequestError("No se pudo actualizar el registro.");
    }

    /** Marca como aplicada hoy y calcula la próxima dosis con el intervalo de la vacuna. */
    async apply(id: string, userId: string): Promise<void> {
        const { data: row } = await this.supabase.from("vaccinations").select("id,applied_at,due_date,vaccine:vaccines(interval_days)").eq("id", id).maybeSingle();
        if (!row) throw new NotFoundError("Registro no encontrado");
        if (row.applied_at) throw new BadRequestError("Esta vacuna ya fue aplicada.");
        const today = limaToday();
        const interval = one((row as any).vaccine)?.interval_days as number | null;
        const { error } = await this.supabase.from("vaccinations").update({
            applied_at: today, administered_by: userId, due_date: interval ? addDays(today, interval) : row.due_date,
        }).eq("id", id);
        if (error) throw new BadRequestError("No se pudo marcar como aplicada.");
    }
}