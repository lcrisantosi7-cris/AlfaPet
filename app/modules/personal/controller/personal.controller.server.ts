import { createClient } from "@supabase/supabase-js";
import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import type { Role } from "~/modules/auth/model/user.types";

const ROLES: readonly Role[] = ["admin", "veterinario", "recepcion"];

function adminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Response("Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.", { status: 500 });
  }
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function field(form: FormData, name: string, max = 200) {
  return String(form.get(name) ?? "").trim().slice(0, max);
}

export async function personalLoader({ request }: LoaderFunctionArgs) {
  const { headers } = await requireUser(request, ["admin"]);
  const supabase = adminClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id,full_name,job_title,role,is_active,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Response(`No se pudo cargar el personal: ${error.message}`, { status: 500, headers });
  return data({ profiles: profiles ?? [] }, { headers });
}

export async function personalAction({ request }: ActionFunctionArgs) {
  const { headers, user } = await requireUser(request, ["admin"]);
  const form = await request.formData();
  const intent = field(form, "intent", 40);
  const supabase = adminClient();

  try {
    if (intent === "create") {
      const fullName = field(form, "full_name", 120);
      const jobTitle = field(form, "job_title", 100);
      const email = field(form, "email", 254).toLowerCase();
      const password = String(form.get("password") ?? "");
      const role = field(form, "role", 30) as Role;

      if (fullName.length < 2) return data({ ok: false, message: "El nombre debe tener al menos 2 caracteres." }, { status: 400, headers });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return data({ ok: false, message: "Ingresa un correo válido." }, { status: 400, headers });
      if (password.length < 12) return data({ ok: false, message: "La contraseña inicial debe tener al menos 12 caracteres." }, { status: 400, headers });
      if (!ROLES.includes(role)) return data({ ok: false, message: "El rol seleccionado no es válido." }, { status: 400, headers });

      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (createError || !created.user) {
        return data({ ok: false, message: `No se pudo crear la cuenta: ${createError?.message ?? "respuesta vacía de autenticación"}` }, { status: 400, headers });
      }

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: created.user.id,
        full_name: fullName,
        job_title: jobTitle || null,
        role,
        is_active: true,
      }, { onConflict: "id" });

      if (profileError) {
        await supabase.auth.admin.deleteUser(created.user.id);
        return data({ ok: false, message: `No se pudo crear el perfil: ${profileError.message}` }, { status: 400, headers });
      }

      return data({ ok: true, message: `Cuenta creada para ${fullName} con el rol ${role}.` }, { headers });
    }

    if (intent === "toggle-active") {
      const profileId = field(form, "profile_id", 80);
      const active = field(form, "active", 5) === "true";
      if (!profileId) return data({ ok: false, message: "No se recibió el usuario seleccionado." }, { status: 400, headers });
      if (profileId === user.id && !active) return data({ ok: false, message: "No puedes desactivar tu propia cuenta." }, { status: 400, headers });

      const { error } = await supabase.from("profiles").update({ is_active: active }).eq("id", profileId);
      if (error) return data({ ok: false, message: `No se pudo actualizar el estado: ${error.message}` }, { status: 400, headers });
      return data({ ok: true, message: active ? "Cuenta activada." : "Cuenta desactivada." }, { headers });
    }

    if (intent === "change-role") {
      const profileId = field(form, "profile_id", 80);
      const role = field(form, "role", 30) as Role;
      if (!profileId || !ROLES.includes(role)) return data({ ok: false, message: "Usuario o rol no válido." }, { status: 400, headers });
      if (profileId === user.id && role !== "admin") return data({ ok: false, message: "No puedes quitarte tu propio rol de administrador." }, { status: 400, headers });

      const { data: target, error: targetError } = await supabase.from("profiles").select("id,role").eq("id", profileId).maybeSingle();
      if (targetError || !target) return data({ ok: false, message: "No se encontró el usuario." }, { status: 404, headers });
      if (target.role === "admin" && role !== "admin") {
        const { count, error: countError } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin").eq("is_active", true);
        if (countError) return data({ ok: false, message: "No se pudo verificar cuántos administradores activos hay." }, { status: 400, headers });
        if ((count ?? 0) <= 1 && target.id === user.id) return data({ ok: false, message: "No puedes quitar el rol al único administrador activo." }, { status: 400, headers });
      }
      const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
      if (error) return data({ ok: false, message: `No se pudo cambiar el rol: ${error.message}` }, { status: 400, headers });
      return data({ ok: true, message: "Rol actualizado correctamente." }, { headers });
    }

    return data({ ok: false, message: "Operación no reconocida." }, { status: 400, headers });
  } catch (error) {
    if (error instanceof Response) throw error;
    return data({ ok: false, message: error instanceof Error ? error.message : "Ocurrió un error inesperado." }, { status: 400, headers });
  }
}
