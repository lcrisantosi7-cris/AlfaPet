import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";
import { NAV_ITEMS } from "./core/config/navigation";

// Solo los módulos con una ruta real se excluyen de las pantallas provisionales.
const BUILT_MODULES = new Set(["inicio", "pacientes", "citas", "consultas", "historial", "vacunas", "cirugias", "analisis", "internamiento", "productos", "ventas", "reportes", "configuracion", "personal"]);

const placeholderRoutes = NAV_ITEMS.filter((item) => !BUILT_MODULES.has(item.key)).map((item) =>
  route(item.path.slice(1), "modules/placeholder/placeholder.route.tsx", { id: item.key }),
);

export default [
  route("theme", "routes/theme.ts"),
  route("login", "modules/auth/login.route.tsx"),
  route("logout", "routes/logout.ts"),
  layout("routes/app-layout.tsx", [
    index("modules/dashboard/dashboard.route.tsx"),
    route("pacientes/nuevo", "modules/pacientes/nuevo.route.ts"),
    route("pacientes", "modules/pacientes/pacientes.route.tsx"),
    route("citas", "modules/citas/citas.route.tsx"),
    route("consultas", "modules/admin/admin.route.tsx", { id: "consultas" }),
    route("historial-clinico", "modules/admin/admin.route.tsx", { id: "historial" }),
    route("vacunas", "modules/admin/admin.route.tsx", { id: "vacunas" }),
    route("productos", "modules/admin/admin.route.tsx", { id: "productos" }),
    route("reportes", "modules/admin/admin.route.tsx", { id: "reportes" }),
    route("configuracion", "modules/admin/admin.route.tsx", { id: "configuracion" }),
    route("cirugias", "modules/cirugias/cirugias.route.tsx"),
    route("cirugias/:id", "modules/cirugias/cirugia-detalle.route.tsx"),
    route("analisis", "modules/analisis/analisis.route.tsx"),
    route("analisis/:id", "modules/analisis/analisis-detalle.route.tsx"),
    route("internamiento", "modules/internamiento/internamiento.route.tsx"),
    route("internamiento/:id", "modules/internamiento/internamiento-detalle.route.tsx"),
    route("ventas", "modules/ventas/ventas.route.tsx"),
    route("personal", "modules/personal/personal.route.tsx"),
    ...placeholderRoutes,
  ]),
] satisfies RouteConfig;