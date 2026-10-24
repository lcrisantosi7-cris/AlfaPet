import type { Route } from "./+types/pacientes.route";
import { ConfirmForm } from "~/core/feedback/ConfirmForm";
import { useActionToast } from "~/core/feedback/use-action-toast";
import { pacientesAction, pacientesLoader } from "./controller/pacientes.controller.server";
import { PacientesView } from "./view/PacientesView";

export const loader = pacientesLoader;
export const action = pacientesAction;
export const meta: Route.MetaFunction = () => [{ title: "Pacientes | AlfaPet" }];

export default function PacientesRoute({ loaderData }: Route.ComponentProps) {
  return <PacientesView {...loaderData} />;
}
