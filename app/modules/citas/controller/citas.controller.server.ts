import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { requireUser } from "~/modules/auth/controller/session.controller.server";

export async function citasLoader({ request }: LoaderFunctionArgs) {
  const { supabase, headers, user } = await requireUser(request);
  const url = new URL(request.url);
  const from = url.searchParams.get("desde");
  const to = url.searchParams.get("hasta");
  const status = url.searchParams.get("estado");

  // appointments tiene dos FK hacia profiles (vet_id y created_by).
  // Indicamos explícitamente la FK de vet_id para evitar la relación ambigua en PostgREST.
  let query = supabase
    .from("appointments")
    .select(
      "id,starts_at,status,notes,vet_id,patient:patients(id,name,species,owner:owners(full_name)),care_type:care_types(label),vet:profiles!appointments_vet_id_fkey(full_name)",
    )
    .order("starts_at", { ascending: true })
    .limit(500);

  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
    query = query.gte("starts_at", from + "T00:00:00");
  }
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    query = query.lt("starts_at", to + "T23:59:59.999");
  }
  if (status && status !== "todos") {
    query = query.eq("status", status as never);
  }

  const [
    { data: rows, error },
    { data: careTypes, error: careError },
    { data: vets, error: vetsError },
    { data: patients, error: patientsError },
  ] = await Promise.all([
    query,
    supabase.from("care_types").select("id,label").eq("is_active", true).order("label"),
    supabase
      .from("profiles")
      .select("id,full_name")
      .eq("is_active", true)
      .eq("role", "veterinario")
      .order("full_name"),
    supabase.from("patients").select("id,name").eq("is_active", true).order("name").limit(500),
  ]);

  if (error) {
    throw new Response(`No se pudieron cargar las citas desde Supabase: ${error.message}`, { status: 500, headers });
  }
  if (careError) {
    throw new Response(`No se pudieron cargar los tipos de atención: ${careError.message}`, { status: 500, headers });
  }
  if (vetsError) {
    throw new Response(`No se pudieron cargar los veterinarios: ${vetsError.message}`, { status: 500, headers });
  }
  if (patientsError) {
    throw new Response(`No se pudieron cargar los pacientes: ${patientsError.message}`, { status: 500, headers });
  }

  return data(
    {
      userRole: user.role,
      filters: { from: from ?? "", to: to ?? "", status: status ?? "todos" },
      patients: patients ?? [],
      appointments: (rows ?? []).map((row: any) => ({
        id: row.id as string,
        startsAt: row.starts_at as string,
        status: String(row.status ?? ""),
        notes: row.notes as string | null,
        vetId: row.vet_id as string | null,
        patientId: row.patient?.id as string | undefined,
        patientName: row.patient?.name as string | undefined,
        species: String(row.patient?.species ?? ""),
        ownerName: row.patient?.owner?.full_name as string | undefined,
        careType: row.care_type?.label as string | undefined,
        vetName: row.vet?.full_name as string | undefined,
      })),
      careTypes: careTypes ?? [],
      vets: vets ?? [],
    },
    { headers },
  );
}

export async function citasAction({ request }: ActionFunctionArgs) {
  assertSameOrigin(request);
  const { supabase, headers, user } = await requireUser(request);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "create");
  const recordId = String(form.get("record_id") ?? "").trim();

  if (intent === "delete") {
    if (user.role === "veterinario") return data({ ok: false, message: "El veterinario no puede eliminar citas." }, { status: 403, headers });
    if (!recordId) return data({ ok: false, message: "Selecciona una cita válida." }, { status: 400, headers });
    const { error } = await supabase.from("appointments").delete().eq("id", recordId);
    if (error) return data({ ok: false, message: "No se pudo eliminar la cita: " + error.message }, { status: 400, headers });
    return data({ ok: true, message: "Cita eliminada correctamente." }, { headers });
  }

  if (intent === "take" || intent === "change-status") {
    if (!recordId) return data({ ok: false, message: "Selecciona una cita válida." }, { status: 400, headers });
    const { data: current, error: currentError } = await supabase.from("appointments").select("id,status,vet_id").eq("id", recordId).maybeSingle();
    if (currentError || !current) return data({ ok: false, message: "No se encontró la cita." }, { status: 404, headers });
    const update: Record<string, unknown> = {};
    if (intent === "take") {
      if (user.role !== "veterinario") return data({ ok: false, message: "Solo un veterinario puede tomar una cita pendiente." }, { status: 403, headers });
      if (current.vet_id && current.vet_id !== user.id) return data({ ok: false, message: "Esta cita ya está asignada a otro veterinario." }, { status: 409, headers });
      if (current.status !== "pendiente") return data({ ok: false, message: "Solo se pueden tomar citas pendientes." }, { status: 400, headers });
      update.vet_id = user.id;
      update.status = "confirmada";
    } else {
      const nextStatus = String(form.get("status") ?? "").trim();
      if (!["pendiente", "confirmada", "cancelada", "completada"].includes(nextStatus)) return data({ ok: false, message: "El estado seleccionado no es válido." }, { status: 400, headers });
      if (user.role === "veterinario" && current.vet_id !== user.id) return data({ ok: false, message: "Solo puedes actualizar el estado de las citas asignadas a ti." }, { status: 403, headers });
      update.status = nextStatus;
    }
    const { error } = await supabase.from("appointments").update(update).eq("id", recordId);
    if (error) return data({ ok: false, message: "No se pudo actualizar la cita: " + error.message }, { status: 400, headers });
    return data({ ok: true, message: intent === "take" ? "Cita asignada a tu agenda." : "Estado de la cita actualizado." }, { headers });
  }

  if (intent === "update" && user.role === "veterinario") return data({ ok: false, message: "La edición completa de citas corresponde a recepción." }, { status: 403, headers });

  const patientId = String(form.get("patient_id") ?? "").trim();
  const careTypeId = String(form.get("care_type_id") ?? "").trim();
  const startsAtRaw = String(form.get("starts_at") ?? "").trim();
  const vetId = String(form.get("vet_id") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  const startsAt = new Date(startsAtRaw);

  if (!patientId || !careTypeId || !startsAtRaw || Number.isNaN(startsAt.getTime())) {
    return data(
      { ok: false, message: "Paciente, tipo de atención y fecha son obligatorios." },
      { status: 400, headers },
    );
  }
  if (startsAt.getTime() <= Date.now()) return data({ ok: false, message: "La cita debe programarse para una fecha y hora futuras." }, { status: 400, headers });

  // La columna appointments.notes limita el texto a 1000 caracteres según el esquema compartido.
  if (notes.length > 1000) {
    return data(
      { ok: false, message: "Las notas no pueden superar los 1000 caracteres." },
      { status: 400, headers },
    );
  }

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .eq("is_active", true)
    .maybeSingle();
  if (patientError || !patient) {
    return data(
      { ok: false, message: "El paciente seleccionado no existe o está inactivo." },
      { status: 400, headers },
    );
  }

  const { data: care, error: careError } = await supabase
    .from("care_types")
    .select("id")
    .eq("id", careTypeId)
    .eq("is_active", true)
    .maybeSingle();
  if (careError || !care) {
    return data(
      { ok: false, message: "El tipo de atención seleccionado no está disponible." },
      { status: 400, headers },
    );
  }

  const insert: Record<string, unknown> = {
    patient_id: patientId,
    care_type_id: careTypeId,
    starts_at: startsAt.toISOString(),
    status: "pendiente",
    notes: notes || null,
    created_by: user.id,
  };

  if (vetId) {
    const { data: vet, error: vetError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", vetId)
      .eq("role", "veterinario")
      .eq("is_active", true)
      .maybeSingle();
    if (vetError || !vet) {
      return data(
        { ok: false, message: "El veterinario seleccionado no está disponible." },
        { status: 400, headers },
      );
    }
    insert.vet_id = vetId;
  }

  if (intent === "update" && !recordId) return data({ ok: false, message: "No se recibió el identificador de la cita." }, { status: 400, headers });
  const { error: insertError } = intent === "update"
    ? await supabase.from("appointments").update({
        patient_id: patientId,
        care_type_id: careTypeId,
        starts_at: startsAt.toISOString(),
        notes: notes || null,
        vet_id: vetId || null,
      }).eq("id", recordId)
    : await supabase.from("appointments").insert(insert);
  if (insertError) {
    return data(
      { ok: false, message: "No se pudo guardar la cita: " + insertError.message },
      { status: 400, headers },
    );
  }
  return data({ ok: true, message: intent === "update" ? "Cita actualizada correctamente." : "Cita creada correctamente." }, { headers });
}
