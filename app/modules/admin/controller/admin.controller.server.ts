import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { findNavItem } from "~/core/config/navigation";
import { assertSameOrigin } from "~/core/security/same-origin.server";
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

const CLINICAL_ROLES = ["admin", "veterinario"] as const;
const INVENTORY_ROLES = ["admin", "recepcion"] as const;

function moduleFor(request: Request) {
  const item = findNavItem(new URL(request.url).pathname);
  if (!item || !TITLES[item.key]) throw new Response("Módulo no encontrado", { status: 404 });
  return item;
}

function textField(form: FormData, key: string, max = 4000) {
  const value = String(form.get(key) ?? "").trim();
  if (value.length > max) throw new Response(`El campo ${key} supera el límite permitido.`, { status: 400 });
  return value || null;
}

function numericField(form: FormData, key: string, min: number, max: number) {
  const raw = String(form.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Response(`El campo ${key} tiene un valor fuera del rango permitido.`, { status: 400 });
  }
  return value;
}

export async function adminModuleLoader({ request }: LoaderFunctionArgs) {
  const item = moduleFor(request);
  const { supabase, headers, user } = await requireUser(request, item.roles);

  if (item.key === "configuracion") {
    const { data: profile, error } = await supabase.from("profiles").select("id,full_name,role,is_active").eq("id", user.id).maybeSingle();
    if (error) throw new Response("No se pudo cargar la configuración del perfil.", { status: 500, headers });
    return data({ moduleKey: item.key, title: TITLES[item.key], rows: profile ? [profile] : [], metrics: [], columns: profile ? Object.keys(profile).filter((key) => key !== "id") : [], readOnly: true, message: null, patients: [], appointments: [], vaccines: [] }, { headers });
  }

  if (item.key === "reportes") {
    const tables = ["patients", "appointments", "consultations", "vaccinations", "products"];
    const results = await Promise.all(tables.map(async (table) => {
      const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
      return { label: table, value: error ? null : count, unavailable: Boolean(error) };
    }));
    return data({ moduleKey: item.key, title: TITLES[item.key], rows: [], metrics: results, columns: [], readOnly: true, message: null, patients: [], appointments: [], vaccines: [] }, { headers });
  }

  const table = TABLES[item.key];
  const [{ data: rows, error }, { data: patients }, { data: appointments }, { data: vaccines }] = await Promise.all([
    supabase.from(table).select("*").limit(300),
    item.key === "consultas" || item.key === "historial" || item.key === "vacunas"
      ? supabase.from("patients").select("id,name").eq("is_active", true).order("name").limit(500)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    item.key === "consultas"
      ? supabase.from("appointments").select("id,starts_at,patient:patients(name)").order("starts_at", { ascending: false }).limit(200)
      : Promise.resolve({ data: [] as any[] }),
    item.key === "vacunas"
      ? supabase.from("vaccines").select("id,name").order("name").limit(300)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  if (error) throw new Response(`No se pudo cargar el módulo de ${TITLES[item.key].toLowerCase()}.`, { status: 500, headers });
  const safeRows = (rows ?? []) as Record<string, unknown>[];
  const columns = safeRows.length ? Object.keys(safeRows[0]).filter((key) => !["id", "created_by", "updated_at"].includes(key)).slice(0, 8) : [];
  return data({
    moduleKey: item.key, title: TITLES[item.key], rows: safeRows, metrics: [], columns,
    readOnly: item.key === "historial", message: null,
    patients: patients ?? [], appointments: appointments ?? [], vaccines: vaccines ?? [],
  }, { headers });
}

export async function adminModuleAction({ request }: ActionFunctionArgs) {
  assertSameOrigin(request);
  const item = moduleFor(request);
  const allowed = item.key === "consultas" || item.key === "historial" || item.key === "vacunas"
    ? CLINICAL_ROLES
    : item.key === "productos" ? INVENTORY_ROLES : item.roles;
  const { supabase, headers, user } = await requireUser(request, allowed);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");

  try {
    if (item.key === "configuracion" && intent === "update-profile") {
      const fullName = textField(form, "full_name", 160);
      if (!fullName || fullName.length < 2) return data({ ok: false, message: "Ingresa un nombre de al menos 2 caracteres." }, { status: 400, headers });
      const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
      if (error) return data({ ok: false, message: "No se pudo actualizar el perfil. Verifica las políticas RLS." }, { status: 400, headers });
      return data({ ok: true, message: "Perfil actualizado correctamente." }, { headers });
    }

    if (item.key === "consultas" && intent === "create") {
      const patientId = textField(form, "patient_id", 80);
      const diagnosis = textField(form, "diagnosis", 4000);
      if (!patientId || !diagnosis) return data({ ok: false, message: "Selecciona un paciente y escribe el diagnóstico." }, { status: 400, headers });
      const insert = {
        patient_id: patientId,
        appointment_id: textField(form, "appointment_id", 80),
        vet_id: user.id,
        weight_kg: numericField(form, "weight_kg", 0.01, 5000),
        temperature_c: numericField(form, "temperature_c", 30, 45),
        symptoms: textField(form, "symptoms"),
        diagnosis,
        treatment: textField(form, "treatment"),
        notes: textField(form, "notes"),
      };
      const { error } = await supabase.from("consultations").insert(insert);
      if (error) return data({ ok: false, message: `No se pudo guardar la consulta: ${error.message}` }, { status: 400, headers });
      return data({ ok: true, message: "Consulta registrada correctamente." }, { headers });
    }

    if (item.key === "productos" && intent === "create") {
      const name = textField(form, "name", 180);
      if (!name) return data({ ok: false, message: "El nombre del producto es obligatorio." }, { status: 400, headers });
      const insert = {
        name,
        description: textField(form, "description"),
        sku: textField(form, "sku", 100),
        stock: numericField(form, "stock", 0, 100000000),
        price: numericField(form, "price", 0, 100000000),
        min_stock: numericField(form, "min_stock", 0, 100000000),
      };
      const { error } = await supabase.from("products").insert(insert);
      if (error) return data({ ok: false, message: `No se pudo guardar el producto: ${error.message}` }, { status: 400, headers });
      return data({ ok: true, message: "Producto registrado correctamente." }, { headers });
    }

    if (item.key === "vacunas" && intent === "create") {
      const patientId = textField(form, "patient_id", 80);
      const vaccineId = textField(form, "vaccine_id", 80);
      const appliedAt = textField(form, "applied_at", 40);
      if (!patientId || !vaccineId || !appliedAt) return data({ ok: false, message: "Completa paciente, vacuna y fecha de aplicación." }, { status: 400, headers });
      const { error } = await supabase.from("vaccinations").insert({
        patient_id: patientId,
        vaccine_id: vaccineId,
        applied_at: appliedAt,
        next_due_at: textField(form, "next_due_at", 40),
        vet_id: user.id,
        notes: textField(form, "notes"),
      });
      if (error) return data({ ok: false, message: `No se pudo registrar la vacunación: ${error.message}` }, { status: 400, headers });
      return data({ ok: true, message: "Vacunación registrada correctamente." }, { headers });
    }

    return data({ ok: false, message: "Esta operación no está habilitada para esta sección." }, { status: 400, headers });
  } catch (error) {
    if (error instanceof Response) throw error;
    return data({ ok: false, message: "Ocurrió un error al guardar. Revisa los campos y los permisos de Supabase." }, { status: 400, headers });
  }
}
