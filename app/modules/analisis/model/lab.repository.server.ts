import type { PostgrestError } from "@supabase/supabase-js";
import { AppError, BadRequestError, ConflictError, ForbiddenError } from "~/core/errors/app-error";
import type { SupabaseServerClient } from "~/core/supabase/client.server";
import type { CreateOrderInput, ResultInput } from "./lab.schema";
import type {
    LabAnalysisOption,
    LabOrderDetail,
    LabOrderRow,
    LabPatientOption,
    LabStatus,
} from "./lab.types";

const OPEN_STATES: LabStatus[] = ["solicitado", "muestra_tomada", "en_proceso"];

export class LabRepository {
    constructor(private readonly supabase: SupabaseServerClient) { }

    async list(): Promise<LabOrderRow[]> {
        const { data, error } = await this.supabase
            .from("lab_orders")
            .select(
                "id,status,created_at,patient:patients(name,species)," +
                "requester:profiles!lab_orders_requested_by_fkey(full_name),items:lab_order_items(id,result_value)",
            )
            .order("created_at", { ascending: false })
            .limit(300);
        if (error) throw new Response("No se pudieron cargar las órdenes de análisis.", { status: 500 });

        return (data ?? []).map((o: any) => ({
            id: o.id, createdAt: o.created_at, status: o.status,
            patientName: o.patient?.name ?? "Paciente", species: String(o.patient?.species ?? ""),
            requesterName: o.requester?.full_name ?? null,
            itemCount: o.items?.length ?? 0,
            resultedCount: (o.items ?? []).filter((i: any) => i.result_value).length,
        }));
    }

    async getDetail(id: string): Promise<LabOrderDetail | null> {
        const { data, error } = await this.supabase
            .from("lab_orders")
            .select(
                "id,status,notes,created_at,patient:patients(name,species,breed,owner:owners(full_name))," +
                "requester:profiles!lab_orders_requested_by_fkey(full_name)," +
                "items:lab_order_items(id,price,result_value,result_unit,reference_range,result_notes,resulted_at," +
                "service:services(name,sample_type),resulter:profiles!lab_order_items_resulted_by_fkey(full_name))",
            )
            .eq("id", id)
            .maybeSingle();
        if (error) throw new Response("No se pudo cargar la orden.", { status: 500 });
        if (!data) return null;

        const o: any = data;
        return {
            id: o.id, createdAt: o.created_at, status: o.status, notes: o.notes,
            patientName: o.patient?.name ?? "Paciente", species: String(o.patient?.species ?? ""),
            breed: o.patient?.breed ?? null, ownerName: o.patient?.owner?.full_name ?? null,
            requesterName: o.requester?.full_name ?? null,
            items: (o.items ?? [])
                .map((i: any) => ({
                    id: i.id, name: i.service?.name ?? "Análisis", sampleType: i.service?.sample_type ?? null,
                    price: Number(i.price), resultValue: i.result_value, resultUnit: i.result_unit,
                    referenceRange: i.reference_range, resultNotes: i.result_notes, resultedAt: i.resulted_at,
                    resultedByName: i.resulter?.full_name ?? null,
                }))
                .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "es")),
        };
    }

    async getPatients(): Promise<LabPatientOption[]> {
        const { data, error } = await this.supabase
            .from("patients").select("id,name,species,owner:owners(full_name)").eq("is_active", true).order("name").limit(1000);
        if (error) throw new Response("No se pudo cargar la lista de pacientes.", { status: 500 });
        return (data ?? []).map((p: any) => ({ id: p.id, name: p.name, species: String(p.species), ownerName: p.owner?.full_name ?? null }));
    }

    async getAnalyses(): Promise<LabAnalysisOption[]> {
        const { data, error } = await this.supabase
            .from("services").select("id,name,sample_type,base_price").eq("category", "analisis").eq("is_active", true).order("name");
        if (error) throw new Response("No se pudo cargar el catálogo de análisis.", { status: 500 });
        return (data ?? []).map((s: any) => ({ id: s.id, name: s.name, sampleType: s.sample_type, price: Number(s.base_price) }));
    }

    async getStatus(id: string): Promise<LabStatus | null> {
        const { data } = await this.supabase.from("lab_orders").select("status").eq("id", id).maybeSingle<{ status: LabStatus }>();
        return data?.status ?? null;
    }

    async create(input: CreateOrderInput): Promise<void> {
        const { error } = await this.supabase.rpc("create_lab_order", {
            p_patient_id: input.patientId, p_service_ids: input.serviceIds, p_notes: input.notes ?? null,
        });
        if (error) throw LabRepository.toError(error);
    }

    async transition(id: string, from: LabStatus[], to: LabStatus, conflict: string): Promise<void> {
        const { data, error } = await this.supabase
            .from("lab_orders").update({ status: to }).eq("id", id).in("status", from).select("id");
        if (error) throw LabRepository.toError(error);
        if (!data?.length) throw new ConflictError(conflict);
    }

    async cancel(id: string): Promise<void> {
        await this.transition(id, OPEN_STATES, "cancelado", "Esta orden ya fue completada o cancelada.");
    }

    async saveResult(input: ResultInput, userId: string): Promise<void> {
        const { data, error } = await this.supabase
            .from("lab_order_items")
            .update({
                result_value: input.value, result_unit: input.unit ?? null, reference_range: input.range ?? null,
                result_notes: input.notes ?? null, resulted_by: userId, resulted_at: new Date().toISOString(),
            })
            .eq("id", input.itemId).eq("order_id", input.orderId).select("id");
        if (error) throw LabRepository.toError(error);
        if (!data?.length) throw new ConflictError("No se encontró el análisis de esta orden.");
    }

    async countPendingResults(orderId: string): Promise<number> {
        const { count } = await this.supabase
            .from("lab_order_items").select("id", { count: "exact", head: true }).eq("order_id", orderId).is("result_value", null);
        return count ?? 0;
    }

    private static toError(error: PostgrestError): AppError {
        switch (error.code) {
            case "22023":
                return new BadRequestError(error.message);
            case "42501":
                return new ForbiddenError("No tienes permiso para esta operación.");
            case "22P02":
            case "23503":
            case "23514":
                return new BadRequestError("Revisa los datos ingresados.");
            default:
                return new AppError("No se pudo completar la operación. Intenta nuevamente.");
        }
    }
}