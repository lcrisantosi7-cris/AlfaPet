import type { Route } from "./+types/internamiento-detalle.route";
import { admissionDetailAction, admissionDetailLoader } from "./controller/admission-detail.controller.server";
import { AdmissionDetailView } from "./view/AdmissionDetailView";

export const loader = admissionDetailLoader;
export const action = admissionDetailAction;
export const meta: Route.MetaFunction = ({ loaderData }) => [
    { title: `${loaderData?.admission.patient.name ?? "Internamiento"} | AlfaPet` },
];

export default function InternamientoDetalleRoute({ loaderData }: Route.ComponentProps) {
    return <AdmissionDetailView admission={loaderData.admission} />;
}