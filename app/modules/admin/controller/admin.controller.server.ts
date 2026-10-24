import { createClient } from "@supabase/supabase-js";
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
  configuracion: "Mi perfil y configuración",
};

const CLINICAL_ROLES = ["admin", "veterinario"] as const;
const INVENTORY_ROLES = ["admin", "recepcion"] as const;

function moduleFor(request: Request) {
  // React Router usa URLs terminadas en .data para solicitar loaders durante
  // la navegación cliente. Resolver por pathname normalizado evita que esos
  // requests se confundan con una ruta de módulo inexistente.
  const url = new URL(request.url);
  const pathname = decodeURIComponent(url.pathname)
    .replace(/\.data$/, "")
    .replace(/\/+$/, "") || "/";
  const item = findNavItem(pathname);

  if (!item || !TITLES[item.key]) {
    throw new Response(
      `Módulo no encontrado para la ruta: ${pathname}`,
      { status: 404 },
    );
  }

  return item;
}

function textField(form: FormData, key: string, max = 2000) {
  const value = String(form.get(key) ?? "").trim();
  if (value.length > max) throw new Response(`El campo ${key} supera el límite permitido.`, { status: 400 });
  return value || null;
}

function numericField(form: FormData, key: string, min: number, max: number, fallback?: number) {
  const raw = String(form.get(key) ?? "").trim();
  if (!raw) return fallback ?? null;
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
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id,full_name,job_title,role,avatar_url,is_active,created_at,updated_at")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw new Response(`No se pudo cargar el perfil: ${error.message}`, { status: 500, headers });
    const safeProfile = profile ? {
      id: profile.id,
      full_name: profile.full_name,
      job_title: profile.job_title,
      role: profile.role,
      avatar_url: profile.avatar_url,
      is_active: profile.is_active,
      created_at: profile.created_at,
    } : null;
    let veterinarians: { id: string; full_name: string; job_title: string | null }[] = [];
    if (user.role === "recepcion") {
      const { data: staff, error: staffError } = await supabase
        .from("profiles")
        .select("id,full_name,job_title")
        .eq("role", "veterinario")
        .order("full_name")
        .limit(200);
      if (staffError) throw new Response(`No se pudieron cargar los veterinarios: ${staffError.message}`, { status: 500, headers });
      veterinarians = staff ?? [];
    }
    return data({
      moduleKey: item.key, title: TITLES[item.key], rows: safeProfile ? [safeProfile] : [],
      metrics: [], columns: safeProfile ? Object.keys(safeProfile).filter((key) => key !== "id") : [],
      readOnly: false, message: null, patients: [], appointments: [], vaccines: [], veterinarians,
    }, { headers });
  }

  if (item.key === "reportes") {
    const url = new URL(request.url);
    const from = url.searchParams.get("desde") ?? "";
    const to = url.searchParams.get("hasta") ?? "";
    const validDate = (value: string) => new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}$").test(value);
    const applyRange = (query: any, column: string) => {
      if (validDate(from)) query = query.gte(column, from);
      if (validDate(to)) query = query.lt(column, to + "T23:59:59.999");
      return query;
    };
    const countQuery = async (tableName: string, column?: string, value?: string, dateColumn?: string) => {
      let query = supabase.from(tableName).select("*", { count: "exact", head: true });
      if (column && value !== undefined) query = query.eq(column, value);
      if (dateColumn) query = applyRange(query, dateColumn);
      const { count, error } = await query;
      return { count: error ? null : count, unavailable: Boolean(error) };
    };
    const definitions: { label: string; table: string; column?: string; value?: string; dateColumn?: string; lowStock?: boolean }[] = [
      { label: "Pacientes activos", table: "patients", column: "is_active", value: "true" },
      { label: "Pacientes inactivos", table: "patients", column: "is_active", value: "false" },
      { label: "Propietarios", table: "owners" },
      { label: "Citas pendientes", table: "appointments", column: "status", value: "pendiente", dateColumn: "starts_at" },
      { label: "Citas confirmadas", table: "appointments", column: "status", value: "confirmada", dateColumn: "starts_at" },
      { label: "Citas atendidas", table: "appointments", column: "status", value: "completada", dateColumn: "starts_at" },
      { label: "Citas canceladas", table: "appointments", column: "status", value: "cancelada", dateColumn: "starts_at" },
      { label: "Consultas clínicas", table: "consultations", dateColumn: "created_at" },
      { label: "Vacunaciones registradas", table: "vaccinations", dateColumn: "applied_at" },
      { label: "Productos en inventario", table: "products" },
      { label: "Productos con stock bajo", table: "products", lowStock: true },
    ];
    const results = await Promise.all(definitions.map(async (definition) => {
      if (definition.lowStock) {
        let offset = 0;
        let lowStockCount = 0;
        let unavailable = false;

        while (true) {
          const { data: products, error } = await supabase
            .from("products")
            .select("id,stock,min_stock")
            .eq("is_active", true)
            .range(offset, offset + 999);

          if (error) {
            unavailable = true;
            break;
          }

          const page = products ?? [];
          lowStockCount += page.filter(
            (product) => Number(product.stock ?? 0) <= Number(product.min_stock ?? 0),
          ).length;

          if (page.length < 1000) break;
          offset += 1000;
        }

        return {
          label: definition.label,
          value: unavailable ? null : lowStockCount,
          unavailable,
        };
      }
      const result = await countQuery(definition.table, definition.column, definition.value, definition.dateColumn);
      return { label: definition.label, value: result.count, unavailable: result.unavailable };
    }));
    return data({
      moduleKey: item.key, title: TITLES[item.key], rows: [], metrics: results,
      columns: [], readOnly: true, message: null, patients: [], appointments: [], vaccines: [],
      reportFilters: { from, to },
    }, { headers });
  }

  const table = TABLES[item.key];
  const [
    { data: rows, error },
    { data: patients, error: patientsError },
    { data: appointments, error: appointmentsError },
    { data: vaccines, error: vaccinesError },
  ] = await Promise.all([
    supabase.from(table).select("*").order("created_at", { ascending: false }).limit(300),
    ["consultas", "historial", "vacunas"].includes(item.key)
      ? supabase.from("patients").select("id,name").eq("is_active", true).order("name").limit(500)
      : Promise.resolve({ data: [] as { id: string; name: string }[], error: null }),
    item.key === "consultas"
      ? supabase.from("appointments").select("id,starts_at,patient:patients(name)").order("starts_at", { ascending: false }).limit(200)
      : Promise.resolve({ data: [] as any[], error: null }),
    item.key === "vacunas"
      ? supabase.from("vaccines").select("id,name").eq("is_active", true).order("name").limit(300)
      : Promise.resolve({ data: [] as { id: number; name: string }[], error: null }),
  ]);

  if (error) throw new Response(`No se pudo cargar ${TITLES[item.key].toLowerCase()}: ${error.message}`, { status: 500, headers });
  if (patientsError) throw new Response(`No se pudieron cargar los pacientes: ${patientsError.message}`, { status: 500, headers });
  if (appointmentsError) throw new Response(`No se pudieron cargar las citas: ${appointmentsError.message}`, { status: 500, headers });
  if (vaccinesError) throw new Response(`No se pudieron cargar las vacunas: ${vaccinesError.message}`, { status: 500, headers });

  let safeRows = (rows ?? []) as Record<string, unknown>[];
  if (item.key === "historial") {
    const { data: vaccineRows, error: vaccineHistoryError } = await supabase
      .from("vaccinations").select("*").order("created_at", { ascending: false }).limit(300);
    if (vaccineHistoryError) throw new Response(`No se pudo cargar el historial de vacunaciones: ${vaccineHistoryError.message}`, { status: 500, headers });
    safeRows = [
      ...safeRows.map((row) => ({ ...row, record_type: "Consulta" })),
      ...((vaccineRows ?? []) as Record<string, unknown>[]).map((row) => ({ ...row, record_type: "Vacunación" })),
    ].sort((a, b) => String(b.created_at ?? b.applied_at ?? "").localeCompare(String(a.created_at ?? a.applied_at ?? "")));
  }

  let categories: { id: number; name: string }[] = [];
  if (item.key === "productos") {
    const { data: categoryRows, error: categoryError } = await supabase
      .from("product_categories")
      .select("id,name")
      .eq("is_active", true)
      .order("name");
    if (categoryError) {
      throw new Response(`No se pudieron cargar las categorías: ${categoryError.message}`, { status: 500, headers });
    }
    categories = categoryRows ?? [];
  }

  const patientIds = [...new Set(safeRows.map((row) => String(row.patient_id ?? "")).filter(Boolean))];
  const appointmentIds = [...new Set(safeRows.map((row) => String(row.appointment_id ?? "")).filter(Boolean))];
  const profileIds = [...new Set(
    safeRows.flatMap((row) => [String(row.vet_id ?? ""), String(row.administered_by ?? "")]).filter(Boolean),
  )];
  const vaccineIds = [...new Set(safeRows.map((row) => Number(row.vaccine_id)).filter((id) => Number.isSafeInteger(id) && id > 0))];

  const patientNames = new Map<string, string>();
  const appointmentLabels = new Map<string, string>();
  const profileNames = new Map<string, string>();
  const vaccineNames = new Map<string, string>();

  if (patientIds.length) {
    const { data: refs } = await supabase.from("patients").select("id,name").in("id", patientIds);
    for (const ref of refs ?? []) patientNames.set(ref.id, ref.name);
  }
  if (appointmentIds.length) {
    const { data: refs } = await supabase
      .from("appointments").select("id,starts_at,patient:patients(name)").in("id", appointmentIds);
    for (const ref of (refs ?? []) as any[]) {
      const relation = Array.isArray(ref.patient) ? ref.patient[0] : ref.patient;
      const when = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(ref.starts_at));
      appointmentLabels.set(ref.id, when + (relation?.name ? " · " + relation.name : ""));
    }
  }
  if (profileIds.length) {
    const { data: refs } = await supabase.from("profiles").select("id,full_name").in("id", profileIds);
    for (const ref of refs ?? []) profileNames.set(ref.id, ref.full_name);
  }
  if (vaccineIds.length) {
    const { data: refs } = await supabase.from("vaccines").select("id,name").in("id", vaccineIds);
    for (const ref of refs ?? []) vaccineNames.set(String(ref.id), ref.name);
  }

  safeRows = safeRows.map((row) => ({
    ...row,
    patient_name: row.patient_id ? patientNames.get(String(row.patient_id)) : undefined,
    appointment_label: row.appointment_id ? appointmentLabels.get(String(row.appointment_id)) : undefined,
    vet_name: row.vet_id ? profileNames.get(String(row.vet_id)) : undefined,
    administered_by_name: row.administered_by ? profileNames.get(String(row.administered_by)) : undefined,
    vaccine_name: row.vaccine_id ? vaccineNames.get(String(row.vaccine_id)) : undefined,
  }));

  const replacements: Record<string, string> = {
    patient_id: "patient_name",
    appointment_id: "appointment_label",
    vet_id: "vet_name",
    administered_by: "administered_by_name",
    vaccine_id: "vaccine_name",
  };
  const excluded = ["id", "created_by", "updated_at"];
  const rawColumns = [...new Set(safeRows.flatMap((row) => Object.keys(row)))];
  const columns = [...new Set(rawColumns
    .map((key) => replacements[key] && safeRows.some((row) => row[replacements[key]] != null) ? replacements[key] : key)
    .filter((key) =>
      !excluded.includes(key) &&
      !key.endsWith("_id") &&
      (!["patient_name", "appointment_label", "vet_name", "administered_by_name", "vaccine_name"].includes(key) ||
        safeRows.some((row) => row[key] != null)),
    ))]
    .slice(0, 10);
  return data({
    moduleKey: item.key, title: TITLES[item.key], rows: safeRows, metrics: [], columns,
    readOnly: item.key === "historial", message: null,
    patients: patients ?? [], appointments: appointments ?? [], vaccines: vaccines ?? [], categories,
  }, { headers });
}

export async function adminModuleAction({ request }: ActionFunctionArgs) {
  assertSameOrigin(request);
  const item = moduleFor(request);
  const allowed = ["consultas", "historial", "vacunas"].includes(item.key)
    ? CLINICAL_ROLES
    : item.key === "productos" ? INVENTORY_ROLES : item.roles;
  const { supabase, headers, user } = await requireUser(request, allowed);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");

  try {
    if (item.key === "configuracion" && intent === "update-profile") {
      const fullName = textField(form, "full_name", 120);
      const password = String(form.get("password") ?? "");
      if (!fullName || fullName.length < 2) {
        return data({ ok: false, message: "Ingresa un nombre de al menos 2 caracteres." }, { status: 400, headers });
      }
      if (password && password.length < 12) {
        return data({ ok: false, message: "La nueva contraseña debe tener al menos 12 caracteres." }, { status: 400, headers });
      }
      if (password) {
        const { error: passwordError } = await supabase.auth.updateUser({ password });
        if (passwordError) return data({ ok: false, message: `No se pudo cambiar la contraseña: ${passwordError.message}` }, { status: 400, headers });
      }
      const { error } = await supabase.from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);
      if (error) return data({ ok: false, message: `No se pudo actualizar el nombre: ${error.message}` }, { status: 400, headers });
      return data({ ok: true, message: password ? "Nombre y contraseña actualizados correctamente." : "Nombre actualizado correctamente." }, { headers });
    }

    if (item.key === "configuracion" && intent === "update-veterinarian") {
      if (user.role !== "recepcion") {
        return data({ ok: false, message: "Solo recepción puede actualizar el perfil de los veterinarios." }, { status: 403, headers });
      }
      const profileId = textField(form, "profile_id", 80);
      const fullName = textField(form, "full_name", 120);
      const password = String(form.get("password") ?? "");
      if (!profileId || !fullName || fullName.length < 2) {
        return data({ ok: false, message: "Selecciona un veterinario e ingresa un nombre válido." }, { status: 400, headers });
      }
      if (password && password.length < 12) {
        return data({ ok: false, message: "La contraseña debe tener al menos 12 caracteres." }, { status: 400, headers });
      }
      const { data: target, error: targetError } = await supabase
        .from("profiles").select("id,role").eq("id", profileId).maybeSingle();
      if (targetError || !target || target.role !== "veterinario") {
        return data({ ok: false, message: "Solo puedes modificar perfiles de veterinarios existentes." }, { status: 404, headers });
      }
      const { error: profileError } = await supabase.from("profiles")
        .update({ full_name: fullName }).eq("id", profileId);
      if (profileError) return data({ ok: false, message: `No se pudo actualizar el nombre: ${profileError.message}` }, { status: 400, headers });
      if (password) {
        const url = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !serviceKey) {
          return data({ ok: false, message: "Falta configurar SUPABASE_SERVICE_ROLE_KEY para cambiar contraseñas de otros usuarios." }, { status: 500, headers });
        }
        const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
        const { error: passwordError } = await admin.auth.admin.updateUserById(profileId, { password });
        if (passwordError) return data({ ok: false, message: `El nombre se guardó, pero no se pudo cambiar la contraseña: ${passwordError.message}` }, { status: 400, headers });
      }
      return data({ ok: true, message: password ? "Perfil y contraseña del veterinario actualizados." : "Nombre del veterinario actualizado." }, { headers });
    }

    if (item.key === "consultas" && intent === "create") {
      const patientId = textField(form, "patient_id", 80);
      const diagnosis = textField(form, "diagnosis", 2000);
      if (!patientId || !diagnosis) return data({ ok: false, message: "Selecciona un paciente y escribe el diagnóstico." }, { status: 400, headers });
      const insert = {
        patient_id: patientId,
        appointment_id: textField(form, "appointment_id", 80),
        vet_id: user.id,
        weight_kg: numericField(form, "weight_kg", 0.01, 5000),
        temperature_c: numericField(form, "temperature_c", 30, 45),
        symptoms: textField(form, "symptoms", 2000),
        diagnosis,
        treatment: textField(form, "treatment", 2000),
        notes: textField(form, "notes", 2000),
      };
      const { error } = await supabase.from("consultations").insert(insert);
      if (error) return data({ ok: false, message: `No se pudo guardar la consulta: ${error.message}` }, { status: 400, headers });
      return data({ ok: true, message: "Consulta registrada correctamente." }, { headers });
    }

    if (item.key === "productos" && intent === "create") {
      const name = textField(form, "name", 120);
      const sku = textField(form, "sku", 40);
      const price = numericField(form, "price", 0, 100000000);
      const stock = numericField(form, "stock", 0, 100000000, 0);
      const minStock = numericField(form, "min_stock", 0, 100000000, 0);
      if (!name || !sku || price === null) {
        return data({ ok: false, message: "Nombre, SKU y precio son obligatorios." }, { status: 400, headers });
      }
      const categoryIdRaw = String(form.get("category_id") ?? "").trim();
      let category: { id: number; name: string } | null = null;
      if (categoryIdRaw) {
        const categoryId = Number(categoryIdRaw);
        if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
          return data({ ok: false, message: "Selecciona una categoría válida." }, { status: 400, headers });
        }
        const { data: foundCategory, error: categoryError } = await supabase
          .from("product_categories").select("id,name").eq("id", categoryId).eq("is_active", true).maybeSingle();
        if (categoryError || !foundCategory) {
          return data({ ok: false, message: "La categoría seleccionada no existe o está inactiva." }, { status: 400, headers });
        }
        category = foundCategory;
      }
      const insert = {
        name, sku, price, stock: stock ?? 0, min_stock: minStock ?? 0,
        category: category?.name ?? null,
        category_id: category?.id ?? null,
      };
      const { error } = await supabase.from("products").insert(insert);
      if (error) return data({ ok: false, message: `No se pudo guardar el producto: ${error.message}` }, { status: 400, headers });
      return data({ ok: true, message: "Producto registrado correctamente." }, { headers });
    }

    if (["consultas", "vacunas", "productos"].includes(item.key) && (intent === "update" || intent === "delete")) {
      if (item.key === "productos" && !INVENTORY_ROLES.includes(user.role as (typeof INVENTORY_ROLES)[number])) {
        return data({ ok: false, message: "No tienes permiso para modificar inventario." }, { status: 403, headers });
      }
      if (["consultas", "vacunas"].includes(item.key) && !CLINICAL_ROLES.includes(user.role as (typeof CLINICAL_ROLES)[number])) {
        return data({ ok: false, message: "No tienes permiso para modificar registros clínicos." }, { status: 403, headers });
      }
      const recordId = textField(form, "record_id", 80);
      if (!recordId) return data({ ok: false, message: "No se recibió el registro seleccionado." }, { status: 400, headers });
      const table = TABLES[item.key];

      if (intent === "delete") {
        const { error } = await supabase.from(table).delete().eq("id", recordId);
        if (error) return data({ ok: false, message: `No se pudo eliminar el registro: ${error.message}` }, { status: 400, headers });
        return data({ ok: true, message: "Registro eliminado correctamente." }, { headers });
      }

      const editable: Record<string, unknown> = {};
      if (item.key === "productos") {
        const name = textField(form, "name", 120);
        const sku = textField(form, "sku", 40);
        const price = numericField(form, "price", 0, 100000000);
        const stock = numericField(form, "stock", 0, 100000000);
        const minStock = numericField(form, "min_stock", 0, 100000000);
        if (!name || !sku || price === null || stock === null || minStock === null) {
          return data({ ok: false, message: "Completa nombre, SKU, precio y existencias válidas." }, { status: 400, headers });
        }
        const categoryIdRaw = String(form.get("category_id") ?? "").trim();
        let category: { id: number; name: string } | null = null;
        if (categoryIdRaw) {
          const categoryId = Number(categoryIdRaw);
          if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
            return data({ ok: false, message: "Selecciona una categoría válida." }, { status: 400, headers });
          }
          const { data: foundCategory, error: categoryError } = await supabase
            .from("product_categories").select("id,name").eq("id", categoryId).eq("is_active", true).maybeSingle();
          if (categoryError || !foundCategory) {
            return data({ ok: false, message: "La categoría seleccionada no existe o está inactiva." }, { status: 400, headers });
          }
          category = foundCategory;
        }
        Object.assign(editable, {
          name, sku, price, stock, min_stock: minStock,
          category: category?.name ?? null,
          category_id: category?.id ?? null,
        });
      } else if (item.key === "consultas") {
        const diagnosis = textField(form, "diagnosis", 2000);
        if (!diagnosis) return data({ ok: false, message: "El diagnóstico es obligatorio." }, { status: 400, headers });
        Object.assign(editable, {
          symptoms: textField(form, "symptoms", 2000),
          diagnosis,
          treatment: textField(form, "treatment", 2000),
          notes: textField(form, "notes", 2000),
          weight_kg: numericField(form, "weight_kg", 0.01, 5000),
          temperature_c: numericField(form, "temperature_c", 30, 45),
        });
      } else {
        const dueDate = textField(form, "due_date", 10);
        const appliedAt = textField(form, "applied_at", 10);
        if (!dueDate) return data({ ok: false, message: "La fecha de próxima dosis es obligatoria." }, { status: 400, headers });
        Object.assign(editable, {
          due_date: dueDate,
          applied_at: appliedAt,
          notes: textField(form, "notes", 500),
        });
      }
      const { error } = await supabase.from(table).update(editable).eq("id", recordId);
      if (error) return data({ ok: false, message: `No se pudo actualizar el registro: ${error.message}` }, { status: 400, headers });
      return data({ ok: true, message: "Registro actualizado correctamente." }, { headers });
    }

    if (item.key === "vacunas" && intent === "create") {
      const patientId = textField(form, "patient_id", 80);
      const vaccineId = textField(form, "vaccine_id", 20);
      const appliedAt = textField(form, "applied_at", 10);
      const dueDate = textField(form, "due_date", 10);
      if (!patientId || !vaccineId || !dueDate) {
        return data({ ok: false, message: "Completa paciente, vacuna y fecha de próxima dosis." }, { status: 400, headers });
      }
      const insert = {
        patient_id: patientId,
        vaccine_id: vaccineId,
        due_date: dueDate,
        applied_at: appliedAt,
        administered_by: user.id,
        notes: textField(form, "notes", 500),
      };
      const { error } = await supabase.from("vaccinations").insert(insert);
      if (error) return data({ ok: false, message: `No se pudo registrar la vacunación: ${error.message}` }, { status: 400, headers });
      return data({ ok: true, message: "Vacunación registrada correctamente." }, { headers });
    }

    return data({ ok: false, message: "Esta operación no está habilitada para esta sección." }, { status: 400, headers });
  } catch (error) {
    if (error instanceof Response) throw error;
    return data({ ok: false, message: error instanceof Error ? error.message : "Ocurrió un error al guardar." }, { status: 400, headers });
  }
}
