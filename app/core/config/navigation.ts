import type { Role } from "~/modules/auth/model/user.types";

export type NavIconName =
  | "home"
  | "patients"
  | "appointments"
  | "consultations"
  | "history"
  | "vaccines"
  | "products"
  | "reports"
  | "settings";

export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: NavIconName;
  roles: readonly Role[];
}

const ALL: readonly Role[] = ["admin", "veterinario", "recepcion"];
const CLINICAL: readonly Role[] = ["admin", "veterinario"];

/** Única fuente de verdad del menú: sidebar, rutas y permisos salen de aquí. */
export const NAV_ITEMS: readonly NavItem[] = [
  { key: "inicio", label: "Inicio", path: "/", icon: "home", roles: ALL },
  { key: "pacientes", label: "Pacientes", path: "/pacientes", icon: "patients", roles: ALL },
  { key: "citas", label: "Citas", path: "/citas", icon: "appointments", roles: ALL },
  { key: "consultas", label: "Consultas", path: "/consultas", icon: "consultations", roles: CLINICAL },
  { key: "historial", label: "Historial Clínico", path: "/historial-clinico", icon: "history", roles: CLINICAL },
  { key: "vacunas", label: "Vacunas", path: "/vacunas", icon: "vaccines", roles: CLINICAL },
  { key: "productos", label: "Productos", path: "/productos", icon: "products", roles: ["admin", "recepcion"] },
  { key: "reportes", label: "Reportes", path: "/reportes", icon: "reports", roles: ["admin"] },
  { key: "configuracion", label: "Mi perfil", path: "/configuracion", icon: "settings", roles: ALL },
];

export const navItemsForRole = (role: Role) =>
  NAV_ITEMS.filter((item) => item.roles.includes(role));

export const findNavItem = (pathname: string) => {
  // React Router puede solicitar loaders como /consultas.data; normalizamos la URL.
  const normalizedPath = pathname.replace(/\\.data$/, "").replace(/\\/+$/, "") || "/";
  return NAV_ITEMS.find((item) => item.path === normalizedPath);
};
