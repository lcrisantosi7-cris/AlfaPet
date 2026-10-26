import type { Route } from "./+types/cirugia-detalle.route";
import { surgeryDetailAction, surgeryDetailLoader } from "./controller/surgery-detail.controller.server";
import { SurgeryDetailView } from "./view/SurgeryDetailView";

export const loader = surgeryDetailLoader;
export const action = surgeryDetailAction;
export const meta: Route.MetaFunction = ({ loaderData }) => [
    { title: `${loaderData?.surgery.patientName ?? "Cirugía"} | AlfaPet` },
];

export default function CirugiaDetalleRoute({ loaderData }: Route.ComponentProps) {
    return <SurgeryDetailView surgery={loaderData.surgery} />;
}