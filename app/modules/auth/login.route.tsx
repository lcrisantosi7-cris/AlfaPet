import type { Route } from "./+types/login.route";
import { loginAction, loginLoader } from "./controller/login.controller.server";
import { LoginView } from "./view/LoginView";

export const loader = loginLoader;
export const action = loginAction;

export const meta: Route.MetaFunction = () => [{ title: "Ingresar | Alfapet Veterinaria" }];

export default function LoginRoute({ loaderData, actionData }: Route.ComponentProps) {
    return <LoginView error={actionData?.error} inactive={loaderData.inactive} />;
}