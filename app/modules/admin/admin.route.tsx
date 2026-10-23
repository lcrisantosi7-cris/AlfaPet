import type { Route } from "./+types/admin.route";
import { adminModuleLoader } from "./controller/admin.controller.server";
import { AdminModuleView } from "./view/AdminModuleView";

export const loader = adminModuleLoader;
export const meta: Route.MetaFunction = ({ loaderData }) => [{ title: `${loaderData?.title ?? "Administración"} | AlfaPet` }];
export default function AdminRoute({ loaderData }: Route.ComponentProps) {
  return <AdminModuleView {...loaderData} />;
}
