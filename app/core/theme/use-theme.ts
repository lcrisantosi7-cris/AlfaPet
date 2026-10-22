import { useFetchers, useRouteLoaderData } from "react-router";
import { DEFAULT_THEME, THEME_FETCHER_KEY, isTheme, type Theme } from "./theme";

/** Tema activo; aplica el cambio al instante mientras el servidor guarda la cookie. */
export function useTheme(): Theme {
  const root = useRouteLoaderData("root") as { theme?: Theme } | undefined;
  const pending = useFetchers()
    .find((fetcher) => fetcher.key === THEME_FETCHER_KEY)
    ?.formData?.get("theme");

  if (isTheme(pending)) return pending;
  return root?.theme ?? DEFAULT_THEME;
}
