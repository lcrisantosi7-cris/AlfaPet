import type { Route } from "./+types/historial.route";
import { historialLoader } from "./controller/historial.controller.server";
import { HistorialView } from "./view/HistorialView";

export const loader = historialLoader;
export const meta: Route.MetaFunction = () => [{ title: "Historial clínico | AlfaPet" }];

export default function HistorialRoute({ loaderData }: Route.ComponentProps) {
    return <HistorialView rows={loaderData.rows} />;
}