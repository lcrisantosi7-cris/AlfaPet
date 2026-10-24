import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import { PatientRepository } from "../model/patient.repository.server";

export async function pacientesLoader({ request }: LoaderFunctionArgs) {
  const { supabase, headers, user } = await requireUser(request);
  const [{ data: patients, error }, options] = await Promise.all([
    supabase
      .from("patients")
      .select("id,name,species,breed,sex,birth_date,weight_kg,microchip,is_active,created_at,owner:owners(id,full_name,phone,email,document_number,address)")
      .order("created_at", { ascending: false })
      .limit(500),
    new PatientRepository(supabase).getOptions(),
  ]);

  if (error) throw new Response("No se pudo cargar la lista de pacientes.", { status: 500, headers });

  return data({
    userRole: user.role,
    options,
    patients: (patients ?? []).map((p: any) => ({
      id: p.id as string,
      name: p.name as string,
      species: String(p.species ?? ""),
      breed: p.breed as string | null,
      sex: p.sex as string | null,
      birthDate: p.birth_date as string | null,
      weightKg: p.weight_kg as number | null,
      microchip: p.microchip as string | null,
      isActive: Boolean(p.is_active),
      createdAt: p.created_at as string,
      ownerId: p.owner?.id as string | undefined,
      ownerName: p.owner?.full_name as string | undefined,
      ownerPhone: p.owner?.phone as string | undefined,
      ownerEmail: p.owner?.email as string | undefined,
      ownerDocument: p.owner?.document_number as string | undefined,
      ownerAddress: p.owner?.address as string | undefined,
    })),
  }, { headers });
}


export async function pacientesAction({ request }: ActionFunctionArgs) {
  assertSameOrigin(request);
  const { supabase, headers, user } = await requireUser(request, ["admin", "recepcion"]);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  const patientId = String(form.get("patient_id") ?? "").trim();
  if (!patientId) return data({ ok: false, message: "No se recibió el identificador del paciente." }, { status: 400, headers });

  const { data: existing, error: existingError } = await supabase
    .from("patients")
    .select("id,owner_id")
    .eq("id", patientId)
    .maybeSingle();
  if (existingError || !existing) return data({ ok: false, message: "No se encontró el paciente." }, { status: 404, headers });

  if (intent === "toggle-active") {
    const active = String(form.get("is_active") ?? "") === "true";
    const { error } = await supabase.from("patients").update({ is_active: !active }).eq("id", patientId);
    if (error) return data({ ok: false, message: "No se pudo cambiar el estado del paciente: " + error.message }, { status: 400, headers });
    return data({ ok: true, message: !active ? "Paciente reactivado." : "Paciente desactivado. Su historial se conserva." }, { headers });
  }

  if (intent !== "update") return data({ ok: false, message: "Operación de pacientes no válida." }, { status: 400, headers });
  const name = String(form.get("name") ?? "").trim();
  const species = String(form.get("species") ?? "").trim();
  const breed = String(form.get("breed") ?? "").trim();
  const sex = String(form.get("sex") ?? "").trim();
  const birthDate = String(form.get("birth_date") ?? "").trim();
  const weightRaw = String(form.get("weight_kg") ?? "").trim();
  const microchip = String(form.get("microchip") ?? "").trim();
  const ownerName = String(form.get("owner_name") ?? "").trim();
  const ownerPhone = String(form.get("owner_phone") ?? "").trim();
  const ownerEmail = String(form.get("owner_email") ?? "").trim();
  const ownerDocument = String(form.get("owner_document") ?? "").trim();
  const ownerAddress = String(form.get("owner_address") ?? "").trim();

  if (name.length < 1 || name.length > 80 || !species || ownerName.length < 2 || ownerName.length > 120) {
    return data({ ok: false, message: "Revisa el nombre del paciente, la especie y el nombre del propietario." }, { status: 400, headers });
  }
  if (birthDate && (!/^\\d{4}-\\d{2}-\\d{2}$/.test(birthDate) || birthDate > new Date().toISOString().slice(0, 10))) {
    return data({ ok: false, message: "La fecha de nacimiento no es válida." }, { status: 400, headers });
  }
  const weight = weightRaw ? Number(weightRaw) : null;
  if (weightRaw && (!Number.isFinite(weight) || Number(weight) <= 0 || Number(weight) > 5000)) {
    return data({ ok: false, message: "El peso debe ser un número mayor que 0 y menor o igual a 5000 kg." }, { status: 400, headers });
  }
  if (ownerEmail && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(ownerEmail)) {
    return data({ ok: false, message: "El correo del propietario no tiene un formato válido." }, { status: 400, headers });
  }

  const { error: patientError } = await supabase.from("patients").update({
    name, species, breed: breed || null, sex: sex || null,
    birth_date: birthDate || null, weight_kg: weight, microchip: microchip || null,
  }).eq("id", patientId);
  if (patientError) return data({ ok: false, message: "No se pudo actualizar la ficha: " + patientError.message }, { status: 400, headers });

  const { error: ownerError } = await supabase.from("owners").update({
    full_name: ownerName, phone: ownerPhone || null, email: ownerEmail || null,
    document_number: ownerDocument || null, address: ownerAddress || null,
  }).eq("id", existing.owner_id);
  if (ownerError) return data({ ok: false, message: "La ficha del paciente se guardó, pero no se pudieron actualizar los datos del propietario: " + ownerError.message }, { status: 400, headers });
  return data({ ok: true, message: "Ficha del paciente y datos del propietario actualizados." }, { headers });
}
