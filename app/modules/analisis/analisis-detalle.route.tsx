import type { Route } from "./+types/analisis-detalle.route";
import { labOrderDetailAction, labOrderDetailLoader } from "./controller/lab-order-detail.controller.server";
import { LabOrderDetailView } from "./view/LabOrderDetailView";

export const loader = labOrderDetailLoader;
export const action = labOrderDetailAction;
export const meta: Route.MetaFunction = ({ loaderData }) => [
    { title: `Análisis de ${loaderData?.order.patientName ?? "paciente"} | AlfaPet` },
];

export default function AnalisisDetalleRoute({ loaderData }: Route.ComponentProps) {
    return <LabOrderDetailView order={loaderData.order} />;
}