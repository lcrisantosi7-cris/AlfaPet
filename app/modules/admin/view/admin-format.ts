const LABELS: Record<string, string> = {
  consultations: "Consultas", patients: "Pacientes", appointments: "Citas",
  vaccinations: "Vacunaciones", products: "Productos", diagnosis: "Diagnóstico",
  treatment: "Tratamiento", symptoms: "Síntomas", created_at: "Fecha de registro",
  weight_kg: "Peso (kg)", temperature_c: "Temperatura (°C)", name: "Nombre",
  species: "Especie", breed: "Raza", stock: "Existencias", min_stock: "Stock mínimo",
  price: "Precio", full_name: "Nombre completo", phone: "Teléfono", email: "Correo",
  role: "Rol", is_active: "Activo", notes: "Notas", status: "Estado",
  patient_id: "Paciente", vaccine_id: "Vacuna", applied_at: "Fecha de aplicación",
  due_date: "Próxima dosis", administered_by: "Administrado por", appointment_id: "Cita",
  category: "Categoría", sku: "SKU", starts_at: "Fecha de cita", job_title: "Cargo",
  avatar_url: "URL de avatar", record_type: "Tipo de registro",
  patient_name: "Paciente", appointment_label: "Cita relacionada", vet_name: "Veterinario",
  vaccine_name: "Vacuna", administered_by_name: "Registrado por",
  occurred_at: "Fecha", title: "Atención", detail: "Detalle", author_name: "Registrado por",

};
export function pretty(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "object") {
    if (Array.isArray(value)) return value.map(pretty).join(", ");
    return Object.values(value as Record<string, unknown>).map(pretty).join(" · ");
  }
  return String(value);
}
export function label(value: string) {
  return LABELS[value] ?? value.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
}

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  completada: "Atendida",
  cancelada: "Cancelada",
  activo: "Activo",
  inactivo: "Inactivo",
  admin: "Administrador",
  veterinario: "Veterinario",
  recepcion: "Recepción",
  aplicada: "Aplicada",
  programada: "Programada",
  en_curso: "En curso",
  completado: "Completado",
  solicitado: "Solicitado",
  muestra_tomada: "Muestra tomada",
  en_proceso: "En proceso",
  internado: "Internado",
  alta: "Alta",
  fallecido: "Fallecido",
  cancelado: "Cancelado",
};

export function displayValue(column: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Activo" : "Inactivo";
  if (["created_at", "updated_at", "starts_at", "applied_at", "due_date", "birth_date", "occurred_at"].includes(column)) {
    const rawDate = String(value);
    const hasTime = rawDate.includes("T") && !["applied_at", "due_date", "birth_date"].includes(column);
    const date = hasTime
      ? new Date(rawDate)
      : new Date(rawDate.slice(0, 10) + "T12:00:00");
    if (Number.isNaN(date.getTime())) return rawDate;
    return new Intl.DateTimeFormat("es-PE", hasTime
      ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "short", year: "numeric" }).format(date);
  }
  if (column === "price") {
    const amount = Number(value);
    return Number.isFinite(amount) ? new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(amount) : String(value);
  }
  if (column === "status" || column === "role") return STATUS_LABELS[String(value)] ?? String(value);
  return pretty(value);
}

export function statusTone(value: unknown): string {
  if (typeof value === "boolean") return value ? "bg-tone-green-soft text-tone-green-fg" : "bg-tone-red-soft text-tone-red-fg";
  switch (String(value ?? "").toLowerCase()) {
    case "completada":
    case "completado":
    case "aplicada":
    case "alta":
    case "activo":
      return "bg-tone-green-soft text-tone-green-fg";
    case "confirmada":
    case "pendiente":
    case "programada":
    case "solicitado":
    case "muestra_tomada":
    case "en_proceso":
    case "en_curso":
    case "internado":
      return "bg-tone-blue-soft text-tone-blue-fg";
    case "cancelada":
    case "cancelado":
    case "fallecido":
    case "inactivo":
      return "bg-tone-red-soft text-tone-red-fg";
    default:
      return "bg-surface-muted text-ink-muted";
  }
}
