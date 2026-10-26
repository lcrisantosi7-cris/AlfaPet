import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { NotFoundError } from "~/core/errors/app-error";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import { deceasedSchema, updatePatientSchema } from "../model/patient.schema";
import { PatientRepository } from "../model/patient.repository.server";
import type { PatientDetailData } from "../model/patient.types";

const one = (v: any) => (Array.isArray(v) ? v[0] : v);

export async function patientDetailLoader({ request, params }: LoaderFunctionArgs) {
    const id = z.uuid().safeParse(params.id);
    if (!id.success) throw new NotFoundError("Paciente no encontrado").toResponse();
    const { supabase, headers, user } = await requireUser(request);

    const { data: p } = await supabase
        .from("patients")
        .select("id,name,species,breed,sex,birth_date,weight_kg,current_weight_kg,weight_updated_at,microchip,color,is_sterilized,allergies,notes,is_active,life_status,deceased_at,deceased_notes,created_at,owner:owners(id,full_name,phone,email,document_number,address)")
        .eq("id", id.data)
        .maybeSingle();
    if (!p) throw new NotFoundError("Paciente no encontrado").toResponse();
    const o = one((p as any).owner);

    const [pets, weights, consults, vaccs, options] = await Promise.all([
        supabase.from("patients").select("id,name,species,life_status,is_active").eq("owner_id", o.id).neq("id", id.data).order("name"),
        supabase.from("patient_weights").select("id,weight_kg,source,recorded_at").eq("patient_id", id.data).order("recorded_at", { ascending: false }).limit(8),
        supabase.from("consultations").select("id,created_at,diagnosis,vet:profiles!consultations_vet_id_fkey(full_name)").eq("patient_id", id.data).order("created_at", { ascending: false }).limit(5),
        supabase.from("vaccinations").select("id,due_date,applied_at,vaccine:vaccines(name)").eq("patient_id", id.data).order("due_date", { ascending: false }).limit(5),
        new PatientRepository(supabase).getOptions(),
    ]);

    const detail: PatientDetailData = {
        patient: {
            id: p.id, name: p.name, species: String(p.species ?? ""), breed: p.breed, sex: p.sex,
            birthDate: p.birth_date, initialWeightKg: p.weight_kg, currentWeightKg: p.current_weight_kg,
            weightUpdatedAt: p.weight_updated_at, microchip: p.microchip, color: p.color,
            isSterilized: p.is_sterilized, allergies: p.allergies, notes: p.notes, isActive: Boolean(p.is_active),
            lifeStatus: p.life_status ?? "vivo", deceasedAt: p.deceased_at, deceasedNotes: p.deceased_notes, createdAt: p.created_at,
        },
        owner: { id: o.id, name: o.full_name, phone: o.phone, email: o.email, document: o.document_number, address: o.address },
        otherPets: (pets.data ?? []).map((x: any) => ({ id: x.id, name: x.name, species: String(x.species ?? ""), lifeStatus: x.life_status ?? "vivo", isActive: Boolean(x.is_active) })),
        weights: (weights.data ?? []).map((w: any) => ({ id: w.id, weightKg: Number(w.weight_kg), source: w.source, recordedAt: w.recorded_at })),
        consultations: (consults.data ?? []).map((c: any) => ({ id: c.id, date: c.created_at, diagnosis: c.diagnosis, vet: one(c.vet)?.full_name ?? null })),
        vaccinations: (vaccs.data ?? []).map((v: any) => ({ id: v.id, vaccine: one(v.vaccine)?.name ?? "Vacuna", dueDate: v.due_date, appliedAt: v.applied_at })),
        options,
        canEdit: user.role === "admin" || user.role === "recepcion",
        isAdmin: user.role === "admin",
    };
    return data(detail, { headers });
}

export async function patientDetailAction({ request, params }: ActionFunctionArgs) {
    assertSameOrigin(request);
    const { supabase, headers, user } = await requireUser(request, ["admin", "recepcion"]);
    const patientId = z.uuid().safeParse(params.id);
    const fail = (message: string, extra: object = {}) => data({ ok: false, message, ...extra }, { status: 400, headers });
    if (!patientId.success) return fail("Paciente no válido.");

    const raw = Object.fromEntries(await request.formData());
    const intent = String(raw.intent ?? "");
    const { data: existing } = await supabase.from("patients").select("id,owner_id,is_active,life_status,current_weight_kg").eq("id", patientId.data).maybeSingle();
    if (!existing) return fail("No se encontró el paciente.");

    if (intent === "toggle-active") {
        if (existing.life_status === "fallecido") return fail("Un paciente fallecido no puede reactivarse desde aquí.");
        const { error } = await supabase.from("patients").update({ is_active: !existing.is_active }).eq("id", patientId.data);
        if (error) return fail("No se pudo cambiar el estado.");
        return data({ ok: true, intent, message: existing.is_active ? "Paciente desactivado. Su historial se conserva." : "Paciente reactivado." }, { headers });
    }

    if (intent === "mark-deceased") {
        const parsed = deceasedSchema.safeParse(raw);
        if (!parsed.success) return fail("Indica una fecha de fallecimiento válida.");
        const { error } = await supabase.from("patients").update({
            life_status: "fallecido", is_active: false,
            deceased_at: parsed.data.deceasedAt, deceased_notes: parsed.data.deceasedNotes ?? null,
        }).eq("id", patientId.data);
        if (error) return fail("No se pudo registrar el fallecimiento.");
        return data({ ok: true, intent, message: "Fallecimiento registrado. El paciente ya no aparecerá en vacunas ni citas nuevas." }, { headers });
    }

    if (intent === "revert-deceased") {
        if (user.role !== "admin") return fail("Solo administración puede revertir este estado.");
        const { error } = await supabase.from("patients").update({ life_status: "vivo", is_active: true, deceased_at: null, deceased_notes: null }).eq("id", patientId.data);
        if (error) return fail("No se pudo revertir el estado.");
        return data({ ok: true, intent, message: "Paciente restablecido como vivo y activo." }, { headers });
    }

    if (intent !== "update") return fail("Operación no válida.");
    const parsed = updatePatientSchema.safeParse(raw);
    if (!parsed.success) return fail("Revisa los campos marcados.", { intent, fieldErrors: z.flattenError(parsed.error).fieldErrors });
    const v = parsed.data;

    const { data: sp } = await supabase.from("species_catalog").select("id").eq("code", v.species.toLowerCase()).eq("is_active", true).maybeSingle();
    if (!sp) return fail("La especie no está disponible en el catálogo.", { intent });

    const { error: pe } = await supabase.from("patients").update({
        name: v.name, species: v.species, species_id: sp.id, breed: v.breed ?? null, sex: v.sex ?? null,
        birth_date: v.birthDate ?? null, microchip: v.microchip ?? null, color: v.color ?? null,
        allergies: v.allergies ?? null, notes: v.notes ?? null,
        is_sterilized: v.isSterilized ? v.isSterilized === "true" : null,
    }).eq("id", patientId.data);
    if (pe) return fail(pe.code === "23505" ? "Ya existe un paciente con ese microchip." : "No se pudo actualizar la ficha.", { intent });

    const { error: oe } = await supabase.from("owners").update({
        full_name: v.ownerName, phone: v.ownerPhone ?? null, email: v.ownerEmail ?? null,
        document_number: v.ownerDocument ?? null, address: v.ownerAddress ?? null,
    }).eq("id", existing.owner_id);
    if (oe) return fail("La ficha se guardó, pero no los datos del dueño.", { intent });

    if (v.currentWeightKg && v.currentWeightKg !== Number(existing.current_weight_kg)) {
        await supabase.rpc("register_patient_weight", { p_patient: patientId.data, p_weight: v.currentWeightKg });
    }
    return data({ ok: true, intent, message: "Ficha del paciente actualizada." }, { headers });
}