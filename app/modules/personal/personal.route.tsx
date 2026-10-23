import type { Route } from "./+types/personal.route";
import { personalAction, personalLoader } from "./controller/personal.controller.server";
import { PersonalView } from "./view/PersonalView";

export const loader = personalLoader;
export const action = personalAction;
export const meta: Route.MetaFunction = () => [{ title: "Gestión de personal | AlfaPet" }];

export default function PersonalRoute({ loaderData }: Route.ComponentProps) {
  return <PersonalView profiles={loaderData.profiles} />;
}
