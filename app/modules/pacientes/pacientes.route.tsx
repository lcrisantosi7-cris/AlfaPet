import type { Route } from "./+types/pacientes.route";
import { pacientesAction, pacientesLoader } from "./controller/pacientes.controller.server";
import { PacientesView } from "./view/PacientesView";

export const loader = pacientesLoader;
export const action = pacientesAction;
export const meta: Route.MetaFunction = () => [{ title: "Pacientes | AlfaPet" }];

export default function PacientesRoute({ loaderData }: Route.ComponentProps) {
  return <PacientesView {...loaderData} />;
}
