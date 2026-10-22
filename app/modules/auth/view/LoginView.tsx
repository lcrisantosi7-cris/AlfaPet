import { PawPrint } from "lucide-react";
import { Form, useNavigation } from "react-router";
import { LOGO_SRC } from "~/core/layout/BrandLogo";
import { SmartImage } from "~/core/ui/SmartImage";

interface LoginViewProps {
    error?: string;
    inactive: boolean;
}

const inputClass =
    "h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm placeholder:text-ink-muted";

export function LoginView({ error, inactive }: LoginViewProps) {
    const submitting = useNavigation().state === "submitting";
    const message = error ?? (inactive ? "Tu cuenta está desactivada. Habla con el administrador." : undefined);

    return (
        <main className="flex min-h-dvh items-center justify-center bg-brand-soft p-4">
            <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-8 shadow-card">
                <div className="mb-6 flex flex-col items-center gap-2 text-center">
                    <SmartImage
                        src={LOGO_SRC}
                        alt=""
                        loading="eager"
                        className="size-24 rounded-full object-cover"
                        fallback={<PawPrint className="size-12 text-brand" aria-hidden />}
                    />
                    <h1 className="text-2xl font-extrabold">Alfapet Veterinaria</h1>
                    <p className="text-sm text-ink-muted">Ingresa con tu cuenta del personal</p>
                </div>

                <Form method="post" className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5 text-sm font-semibold">
                        Correo
                        <input name="email" type="email" required autoComplete="username" className={inputClass} />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-semibold">
                        Contraseña
                        <input
                            name="password"
                            type="password"
                            required
                            minLength={8}
                            autoComplete="current-password"
                            className={inputClass}
                        />
                    </label>

                    {message && (
                        <p role="alert" className="rounded-lg bg-tone-orange-soft px-3 py-2 text-sm text-tone-orange-fg">
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="h-12 rounded-xl bg-brand font-semibold text-on-brand disabled:opacity-60"
                    >
                        {submitting ? "Ingresando…" : "Ingresar"}
                    </button>
                </Form>
            </div>
        </main>
    );
}