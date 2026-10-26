import type { Route } from "./+types/consultas.route";
import { consultasAction, consultasLoader } from "./controller/consultas.controller.server";
import { ConsultasView } from "./view/ConsultasView";

export const loader = consultasLoader;
export const action = consultasAction;
export const meta: Route.MetaFunction = () => [{ title: "Consultas | AlfaPet" }];

export default function ConsultasRoute({ loaderData }: Route.ComponentProps) {
    return <ConsultasView {...loaderData} />;
}