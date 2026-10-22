import { InvalidOriginError } from "~/core/errors/app-error";

/** Defensa CSRF para acciones POST: rechaza peticiones que no vienen de este mismo sitio. */
export function assertSameOrigin(request: Request): void {
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw new InvalidOriginError().toResponse();
  }

  const origin = request.headers.get("Origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    throw new InvalidOriginError().toResponse();
  }
}