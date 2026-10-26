import type { Route } from "./+types/historial-detalle.route";
import { historialDetailLoader } from "./controller/historial.controller.server";
import { HistorialDetailView } from "./view/HistorialDetailView";

export const loader = historialDetailLoader;
export const meta: Route.MetaFunction = ({ loaderData }) => [{ title: `Historial de ${loaderData?.patient.name ?? "paciente"} | AlfaPet` }];

export default function HistorialDetalleRoute({ loaderData }: Route.ComponentProps) {
    return <HistorialDetailView patient={loaderData.patient} timeline={loaderData.timeline} />;
}