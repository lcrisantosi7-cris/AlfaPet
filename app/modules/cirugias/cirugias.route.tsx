import type { Route } from "./+types/cirugias.route";
import { cirugiasAction, cirugiasLoader } from "./controller/cirugias.controller.server";
import { CirugiasView } from "./view/CirugiasView";

export const loader = cirugiasLoader;
export const action = cirugiasAction;
export const meta: Route.MetaFunction = () => [{ title: "Cirugías | AlfaPet" }];

export default function CirugiasRoute({ loaderData }: Route.ComponentProps) {
    return <CirugiasView {...loaderData} />;
}