import type { Route } from "./+types/dashboard.route";
import { dashboardLoader } from "./controller/dashboard.controller.server";
import { DashboardView } from "./view/DashboardView";

export const loader = dashboardLoader;

export const meta: Route.MetaFunction = () => [{ title: "Inicio | Alfapet Veterinaria" }];

export default function DashboardRoute({ loaderData }: Route.ComponentProps) {
  return <DashboardView {...loaderData} />;
}