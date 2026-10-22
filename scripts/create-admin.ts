import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Crea el usuario administrador. Las credenciales vienen del entorno,
 * nunca del código:  npm run admin:create
 */
class AdminProvisioner {
    private readonly supabase: SupabaseClient;

    constructor(
        url: string,
        serviceKey: string,
        private readonly admin: { email: string; password: string; name: string; jobTitle: string },
    ) {
        this.supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
    }

    async run(): Promise<void> {
        const { data, error } = await this.supabase.auth.admin.createUser({
            email: this.admin.email,
            password: this.admin.password,
            email_confirm: true,
        });
        if (error) throw new Error(`Auth: ${error.message}`);

        const { error: profileError } = await this.supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: this.admin.name,
            job_title: this.admin.jobTitle,
            role: "admin",
            is_active: true,
        });
        if (profileError) throw new Error(`Perfil: ${profileError.message}`);

        console.log(`Administrador listo: ${this.admin.email}`);
    }
}

function requireEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`Falta la variable de entorno ${name}`);
    return value;
}

try {
    const password = requireEnv("ADMIN_PASSWORD");
    if (password.length < 12) throw new Error("ADMIN_PASSWORD debe tener al menos 12 caracteres");

    await new AdminProvisioner(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
        email: requireEnv("ADMIN_EMAIL").toLowerCase(),
        password,
        name: process.env.ADMIN_NAME?.trim() || "Administrador AlfaPet",
        jobTitle: process.env.ADMIN_JOB_TITLE?.trim() || "Administrador",
    }).run();
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
}