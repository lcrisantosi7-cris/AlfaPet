import type { Route } from "./+types/consulta-detalle.route";
import { consultaDetailAction, consultaDetailLoader } from "./controller/consulta-detail.controller.server";
import { ConsultaDetailView } from "./view/ConsultaDetailView";

export const loader = consultaDetailLoader;
export const action = consultaDetailAction;
export const meta: Route.MetaFunction = ({ loaderData }) => [{ title: `Consulta de ${loaderData?.consulta.patientName ?? "paciente"} | AlfaPet` }];

export default function ConsultaDetalleRoute({ loaderData }: Route.ComponentProps) {
    return <ConsultaDetailView consulta={loaderData.consulta} />;
}