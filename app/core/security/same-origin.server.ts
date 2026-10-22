import { data } from "react-router";

/** Defensa CSRF para acciones POST: rechaza peticiones que no vienen de este mismo sitio. */
export function assertSameOrigin(request: Request) {
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw data("Origen no permitido", { status: 403 });
  }

  const origin = request.headers.get("Origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    throw data("Origen no permitido", { status: 403 });
  }
}
