import { data, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { clearRateLimit, isRateLimited } from "~/core/security/rate-limit.server";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { createSupabaseServerClient } from "~/core/supabase/client.server";

const credentials = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email()),
    password: z.string().min(8).max(128),
});

export async function loginLoader({ request }: LoaderFunctionArgs) {
    const { supabase, headers } = createSupabaseServerClient(request);
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) throw redirect("/", { headers });

    const inactive = new URL(request.url).searchParams.get("error") === "inactivo";
    return data({ inactive }, { headers });
}

export async function loginAction({ request }: ActionFunctionArgs) {
    assertSameOrigin(request);

    const form = await request.formData();
    const parsed = credentials.safeParse({ email: form.get("email"), password: form.get("password") });
    if (!parsed.success) {
        return data({ error: "Revisa el correo y la contraseña." }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const key = `${ip}:${parsed.data.email}`;
    if (isRateLimited(key)) {
        return data({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
    }

    const { supabase, headers } = createSupabaseServerClient(request);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    // Mensaje genérico: no revela si el correo existe
    if (error) return data({ error: "Correo o contraseña incorrectos." }, { status: 401 });

    clearRateLimit(key);
    throw redirect("/", { headers });
}