import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { requireUser } from "~/modules/auth/controller/session.controller.server";

export async function citasLoader({ request }: LoaderFunctionArgs) {
  const { supabase, headers, user } = await requireUser(request);
  const url = new URL(request.url);
  const from = url.searchParams.get("desde");
  const to = url.searchParams.get("hasta");
  const status = url.searchParams.get("estado");

  let query = supabase
    .from("appointments")
    .select("id,starts_at,status,notes,patient:patients(id,name,species,owner:owners(full_name)),care_type:care_types(label),vet:profiles(full_name)")
    .order("starts_at", { ascending: true })
    .limit(500);

  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) query = query.gte("starts_at", from + "T00:00:00");
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) query = query.lt("starts_at", to + "T23:59:59.999");
  if (status && status !== "todos") query = query.eq("status", status as never);

  const [{ data: rows, error }, { data: careTypes, error: careError }, { data: vets, error: vetsError }] = await Promise.all([
    query,
    supabase.from("care_types").select("id,label").order("label"),
    supabase.from("profiles").select("id,full_name").eq("is_active", true).eq("role", "veterinario").order("full_name"),
  ]);

  if (error) throw new Response(`No se pudieron cargar las citas desde Supabase: ${error.message}`, { status: 500, headers });
  if (careError) throw new Response(`No se pudieron cargar los tipos de atención: ${careError.message}`, { status: 500, headers });
  if (vetsError) throw new Response(`No se pudieron cargar los veterinarios: ${vetsError.message}`, { status: 500, headers });

  return data({
    userRole: user.role,
    filters: { from: from ?? "", to: to ?? "", status: status ?? "todos" },
    patients: await (async () => { const result = await supabase.from("patients").select("id,name").eq("is_active", true).order("name").limit(500); if (result.error) throw new Response(`No se pudieron cargar los pacientes: ${result.error.message}`, { status: 500, headers }); return result.data ?? []; })(),
    appointments: (rows ?? []).map((row: any) => ({
      id: row.id as string,
      startsAt: row.starts_at as string,
      status: String(row.status ?? ""),
      notes: row.notes as string | null,
      patientId: row.patient?.id as string | undefined,
      patientName: row.patient?.name as string | undefined,
      species: String(row.patient?.species ?? ""),
      ownerName: row.patient?.owner?.full_name as string | undefined,
      careType: row.care_type?.label as string | undefined,
      vetName: row.vet?.full_name as string | undefined,
    })),
    careTypes: careTypes ?? [],
    vets: vets ?? [],
  }, { headers });
}

export async function citasAction({ request }: ActionFunctionArgs) {
  assertSameOrigin(request);
  const { supabase, headers, user } = await requireUser(request);
  const form = await request.formData();
  const patientId = String(form.get("patient_id") ?? "").trim();
  const careTypeId = String(form.get("care_type_id") ?? "").trim();
  const startsAtRaw = String(form.get("starts_at") ?? "").trim();
  const vetId = String(form.get("vet_id") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  const startsAt = new Date(startsAtRaw);
  if (!patientId || !careTypeId || !startsAtRaw || Number.isNaN(startsAt.getTime())) {
    return data({ ok: false, message: "Paciente, tipo de atención y fecha son obligatorios." }, { status: 400, headers });
  }
  if (notes.length > 2000) return data({ ok: false, message: "Las notas superan el máximo de 2000 caracteres." }, { status: 400, headers });
  const { data: patient, error: patientError } = await supabase.from("patients").select("id").eq("id", patientId).eq("is_active", true).maybeSingle();
  if (patientError || !patient) return data({ ok: false, message: "El paciente seleccionado no existe o está inactivo." }, { status: 400, headers });
  const { data: care, error: careError } = await supabase.from("care_types").select("id").eq("id", careTypeId).maybeSingle();
  if (careError || !care) return data({ ok: false, message: "El tipo de atención seleccionado no está disponible." }, { status: 400, headers });
  const insert: Record<string, unknown> = {
    patient_id: patientId, care_type_id: careTypeId, starts_at: startsAt.toISOString(),
    status: "pendiente", notes: notes || null, created_by: user.id,
  };
  if (vetId) {
    const { data: vet } = await supabase.from("profiles").select("id").eq("id", vetId).eq("role", "veterinario").eq("is_active", true).maybeSingle();
    if (!vet) return data({ ok: false, message: "El veterinario seleccionado no está disponible." }, { status: 400, headers });
    insert.vet_id = vetId;
  }
  const { error } = await supabase.from("appointments").insert(insert);
  if (error) return data({ ok: false, message: "No se pudo guardar la cita. Verifica los campos y las políticas de Supabase." }, { status: 400, headers });
  return data({ ok: true, message: "Cita creada correctamente." }, { headers });
}
