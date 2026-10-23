import { data, type LoaderFunctionArgs } from "react-router";
import { findNavItem } from "~/core/config/navigation";
import { requireUser } from "~/modules/auth/controller/session.controller.server";

const TABLES: Record<string, string> = {
  consultas: "consultations",
  historial: "consultations",
  vacunas: "vaccinations",
  productos: "products",
};

const TITLES: Record<string, string> = {
  consultas: "Consultas",
  historial: "Historial clínico",
  vacunas: "Vacunas",
  productos: "Productos e inventario",
  reportes: "Reportes",
  configuracion: "Configuración",
};

export async function adminModuleLoader({ request }: LoaderFunctionArgs) {
  const pathname = new URL(request.url).pathname;
  const item = findNavItem(pathname);
  if (!item || !TITLES[item.key]) throw new Response("Módulo no encontrado", { status: 404 });
  const { supabase, headers, user } = await requireUser(request, item.roles);

  if (item.key === "configuracion") {
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) throw new Response("No se pudo cargar la configuración del perfil.", { status: 500, headers });
    return data({ moduleKey: item.key, title: TITLES[item.key], rows: profile ? [profile] : [], metrics: [], columns: profile ? Object.keys(profile) : [], readOnly: true }, { headers });
  }

  if (item.key === "reportes") {
    const tables = ["patients", "appointments", "consultations", "vaccinations", "products"];
    const results = await Promise.all(tables.map(async (table) => {
      const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
      return { label: table, value: error ? null : count, unavailable: Boolean(error) };
    }));
    return data({ moduleKey: item.key, title: TITLES[item.key], rows: [], metrics: results, columns: [], readOnly: true }, { headers });
  }

  const table = TABLES[item.key];
  let query = supabase.from(table).select("*").limit(300);

  const { data: rows, error } = await query;
  if (error) throw new Response(`No se pudo cargar el módulo de ${TITLES[item.key].toLowerCase()}.`, { status: 500, headers });
  const safeRows = (rows ?? []) as Record<string, unknown>[];
  const columns = safeRows.length ? Object.keys(safeRows[0]).filter((key) => !["id", "created_by", "updated_at"].includes(key)).slice(0, 7) : [];
  return data({ moduleKey: item.key, title: TITLES[item.key], rows: safeRows, metrics: [], columns, readOnly: true }, { headers });
}
