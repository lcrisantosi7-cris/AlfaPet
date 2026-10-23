import { data, type LoaderFunctionArgs } from "react-router";
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
    supabase.from("care_types").select("id,label").eq("is_active", true).order("label"),
    supabase.from("profiles").select("id,full_name").eq("is_active", true).eq("role", "veterinario").order("full_name"),
  ]);

  if (error) throw new Response("No se pudieron cargar las citas.", { status: 500, headers });
  if (careError || vetsError) throw new Response("No se pudieron cargar los catálogos de citas.", { status: 500, headers });

  return data({
    userRole: user.role,
    filters: { from: from ?? "", to: to ?? "", status: status ?? "todos" },
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
