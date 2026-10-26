import type { Route } from "./+types/paciente-detalle.route";
import { patientDetailAction, patientDetailLoader } from "./controller/patient-detail.controller.server";
import { PatientDetailView } from "./view/PatientDetailView";

export const loader = patientDetailLoader;
export const action = patientDetailAction;
export const meta: Route.MetaFunction = ({ loaderData }) => [{ title: `${loaderData?.patient.name ?? "Paciente"} | AlfaPet` }];

export default function PacienteDetalleRoute({ loaderData }: Route.ComponentProps) {
    return <PatientDetailView {...loaderData} />;
}