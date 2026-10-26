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
    route("pacientes/:id", "modules/pacientes/paciente-detalle.route.tsx"),
    route("pacientes", "modules/pacientes/pacientes.route.tsx"),
    route("citas", "modules/citas/citas.route.tsx"),
    route("consultas", "modules/consultas/consultas.route.tsx"),
    route("consultas/:id", "modules/consultas/consulta-detalle.route.tsx"),
    route("historial-clinico", "modules/historial/historial.route.tsx"),
    route("historial-clinico/:id", "modules/historial/historial-detalle.route.tsx"),
    route("vacunas", "modules/vacunas/vacunas.route.tsx"),
    route("productos", "modules/productos/productos.route.tsx"),
    route("productos/:id", "modules/productos/producto-detalle.route.tsx"),
    route("reportes", "modules/reportes/reportes.route.tsx"),
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