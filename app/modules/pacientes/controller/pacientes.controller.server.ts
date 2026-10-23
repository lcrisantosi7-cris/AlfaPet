import { data, type LoaderFunctionArgs } from "react-router";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import { PatientRepository } from "../model/patient.repository.server";

export async function pacientesLoader({ request }: LoaderFunctionArgs) {
  const { supabase, headers, user } = await requireUser(request);
  const [{ data: patients, error }, options] = await Promise.all([
    supabase
      .from("patients")
      .select("id,name,species,breed,sex,birth_date,weight_kg,microchip,is_active,created_at,owner:owners(id,full_name,phone)")
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
      ownerName: p.owner?.full_name as string | undefined,
      ownerPhone: p.owner?.phone as string | undefined,
    })),
  }, { headers });
}
