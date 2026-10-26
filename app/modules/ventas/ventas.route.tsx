import type { Route } from "./+types/ventas.route";
import { ventasAction, ventasLoader } from "./controller/ventas.controller.server";
import { VentasView } from "./view/VentasView";

export const loader = ventasLoader;
export const action = ventasAction;
export const meta: Route.MetaFunction = () => [{ title: "Ventas y caja | AlfaPet" }];

export default function VentasRoute({ loaderData }: Route.ComponentProps) {
    return <VentasView {...loaderData} />;
}