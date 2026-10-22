import { data, redirect } from "react-router";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { isTheme } from "~/core/theme/theme";
import { serializeTheme } from "~/core/theme/theme.server";
import type { Route } from "./+types/theme";

export const loader = () => redirect("/");

export async function action({ request }: Route.ActionArgs) {
  assertSameOrigin(request);

  const theme = (await request.formData()).get("theme");
  if (!isTheme(theme)) throw data("Tema no válido", { status: 400 });

  return data({ theme }, { headers: { "Set-Cookie": await serializeTheme(theme) } });
}
