import { createCookie } from "react-router";
import { DEFAULT_THEME, isTheme, type Theme } from "./theme";

const themeCookie = createCookie("alfapet_theme", {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  secure: import.meta.env.PROD,
  maxAge: 60 * 60 * 24 * 365,
});

export async function getTheme(request: Request): Promise<Theme> {
  const value = await themeCookie.parse(request.headers.get("Cookie"));
  return isTheme(value) ? value : DEFAULT_THEME;
}

export const serializeTheme = (theme: Theme) => themeCookie.serialize(theme);
