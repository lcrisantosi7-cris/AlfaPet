import type { Route } from "./+types/citas.route";
import { citasLoader } from "./controller/citas.controller.server";
import { CitasView } from "./view/CitasView";

export const loader = citasLoader;
export const meta: Route.MetaFunction = () => [{ title: "Citas y agenda | AlfaPet" }];

export default function CitasRoute({ loaderData }: Route.ComponentProps) {
  return <CitasView {...loaderData} />;
}
