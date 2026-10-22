import { data, redirect } from "react-router";
import { createSupabaseServerClient } from "~/core/supabase/client.server";
import type { Role, SessionUser } from "../model/user.types";

interface ProfileRow {
  id: string;
  full_name: string;
  job_title: string | null;
  role: Role;
  avatar_url: string | null;
  is_active: boolean;
}

/**
 * Exige sesión válida (verificada con Supabase, no solo leyendo la cookie),
 * perfil activo y, opcionalmente, uno de los roles permitidos.
 * Úsalo al inicio de CADA loader/action protegido.
 */
export async function requireUser(request: Request, allowedRoles?: readonly Role[]) {
  const { supabase, headers } = createSupabaseServerClient(request);

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw redirect("/login", { headers });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, job_title, role, avatar_url, is_active")
    .eq("id", auth.user.id)
    .single<ProfileRow>();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    throw redirect("/login?error=inactivo", { headers });
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    throw data("No tienes permiso para ver esta sección", { status: 403, headers });
  }

  const user: SessionUser = {
    id: profile.id,
    name: profile.full_name,
    jobTitle: profile.job_title ?? "",
    role: profile.role,
    avatarUrl: profile.avatar_url ?? undefined,
  };

  return { supabase, headers, user };
}