import { data, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { loginLimiter, type RateLimiter } from "~/core/security/rate-limiter.server";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { createSupabaseServerClient } from "~/core/supabase/client.server";
import { AuthService } from "../model/auth.service.server";

const credentials = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email()),
    password: z.string().min(8).max(128),
});

export class LoginController {
    constructor(private readonly limiter: RateLimiter = loginLimiter) { }

    loader = async ({ request }: LoaderFunctionArgs) => {
        const { supabase, headers } = createSupabaseServerClient(request);
        const session = await new AuthService(supabase).getSession();
        if (session.kind === "active") throw redirect("/", { headers });

        const inactive = new URL(request.url).searchParams.get("error") === "inactivo";
        return data({ inactive }, { headers });
    };

    action = async ({ request }: ActionFunctionArgs) => {
        assertSameOrigin(request);

        const form = await request.formData();
        const parsed = credentials.safeParse({
            email: form.get("email"),
            password: form.get("password"),
        });
        if (!parsed.success) {
            return data({ error: "Revisa el correo y la contraseña." }, { status: 400 });
        }

        const { email, password } = parsed.data;
        const key = `${LoginController.clientIp(request)}:${email}`;
        if (this.limiter.isLimited(key)) {
            return data({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
        }

        const { supabase, headers } = createSupabaseServerClient(request);
        const ok = await new AuthService(supabase).signIn(email, password);

        // Mensaje genérico: no revela si el correo existe
        if (!ok) return data({ error: "Correo o contraseña incorrectos." }, { status: 401 });

        this.limiter.reset(key);
        throw redirect("/", { headers });
    };

    private static clientIp(request: Request): string {
        return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    }
}

const controller = new LoginController();
export const loginLoader = controller.loader;
export const loginAction = controller.action;