import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";
import { NAV_ITEMS } from "./core/config/navigation";

// Módulos aún sin construir: comparten una pantalla provisional.
// Cuando un módulo tenga su propia ruta, quítalo de este filtro y agrégalo abajo.
const BUILT_MODULES = new Set(["inicio"]);

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
    ...placeholderRoutes,
  ]),
] satisfies RouteConfig;