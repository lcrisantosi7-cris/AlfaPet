import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { env } from "./env.server";

/**
 * Cliente de Supabase para UNA petición. La sesión viaja en cookies httpOnly.
 * Devuelve `headers`: hay que enviarlos en la respuesta para que el navegador
 * reciba las cookies renovadas.
 */
export function createSupabaseServerClient(request: Request) {
    const headers = new Headers();

    const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        cookies: {
            getAll: () =>
                parseCookieHeader(request.headers.get("Cookie") ?? "").map(({ name, value }) => ({
                    name,
                    value: value ?? "",
                })),
            setAll: (cookies) =>
                cookies.forEach(({ name, value, options }) =>
                    headers.append("Set-Cookie", serializeCookieHeader(name, value, options)),
                ),
        },
    });

    return { supabase, headers };
}

export type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>["supabase"];