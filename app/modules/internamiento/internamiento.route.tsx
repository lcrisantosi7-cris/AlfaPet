import type { Route } from "./+types/internamiento.route";
import { internamientoAction, internamientoLoader } from "./controller/internamiento.controller.server";
import { InternamientoView } from "./view/InternamientoView";

export const loader = internamientoLoader;
export const action = internamientoAction;
export const meta: Route.MetaFunction = () => [{ title: "Internamiento | AlfaPet" }];

export default function InternamientoRoute({ loaderData }: Route.ComponentProps) {
    return <InternamientoView {...loaderData} />;
}