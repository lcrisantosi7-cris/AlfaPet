import type { Route } from "./+types/vacunas.route";
import { vacunasAction, vacunasLoader } from "./controller/vacunas.controller.server";
import { VacunasView } from "./view/VacunasView";

export const loader = vacunasLoader;
export const action = vacunasAction;
export const meta: Route.MetaFunction = () => [{ title: "Vacunas | AlfaPet" }];

export default function VacunasRoute({ loaderData }: Route.ComponentProps) {
    return <VacunasView {...loaderData} />;
}