import type { Route } from "./+types/analisis.route";
import { analisisAction, analisisLoader } from "./controller/analisis.controller.server";
import { AnalisisView } from "./view/AnalisisView";

export const loader = analisisLoader;
export const action = analisisAction;
export const meta: Route.MetaFunction = () => [{ title: "Análisis clínicos | AlfaPet" }];

export default function AnalisisRoute({ loaderData }: Route.ComponentProps) {
    return <AnalisisView {...loaderData} />;
}