import type { Route } from "./+types/reportes.route";
import { reportesLoader } from "./controller/reportes.controller.server";
import { ReportesView } from "./view/ReportesView";

export const loader = reportesLoader;
export const meta: Route.MetaFunction = () => [{ title: "Reportes | AlfaPet" }];

export default function ReportesRoute({ loaderData }: Route.ComponentProps) {
    return <ReportesView report={loaderData.report} />;
}