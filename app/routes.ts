import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";
import { NAV_ITEMS } from "./core/config/navigation";

// Solo los módulos con una ruta real se excluyen de las pantallas provisionales.
const BUILT_MODULES = new Set(["inicio", "pacientes", "citas"]);

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
    ...placeholderRoutes,
  ]),
] satisfies RouteConfig;
