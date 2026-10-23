import { Eye, EyeOff, PawPrint } from "lucide-react";
import { useState } from "react";
import { Form, useNavigation } from "react-router";
import { LOGO_SRC } from "~/core/layout/BrandLogo";
import { SmartImage } from "~/core/ui/SmartImage";

interface LoginViewProps {
    error?: string;
    inactive: boolean;
}

const inputClass =
    "h-12 w-full rounded-xl border border-line bg-surface px-4 text-sm placeholder:text-ink-muted outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

export function LoginView({ error, inactive }: LoginViewProps) {
    const submitting = useNavigation().state !== "idle";
    const [showPassword, setShowPassword] = useState(false);
    const message = error ?? (inactive ? "Tu cuenta está desactivada. Habla con el administrador." : undefined);

    return (
        <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-brand-soft p-4">
            <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-brand/10 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-28 -left-20 size-96 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="relative w-full max-w-md rounded-3xl border border-line bg-surface/95 p-7 shadow-2xl shadow-brand/10 backdrop-blur sm:p-9">
                <div className="mb-8 flex flex-col items-center gap-2 text-center">
                    <div className="mb-2 flex size-24 items-center justify-center rounded-3xl bg-brand-soft ring-1 ring-brand/10">
                        <SmartImage
                            src={LOGO_SRC}
                            alt="Logo de AlfaPet"
                            loading="eager"
                            className="size-20 rounded-2xl object-cover"
                            fallback={<PawPrint className="size-12 text-brand" aria-hidden />}
                        />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-text">Atención veterinaria</p>
                    <h1 className="text-3xl font-extrabold tracking-tight">Bienvenido a AlfaPet</h1>
                    <p className="text-sm text-ink-muted">Ingresa con tu cuenta del personal</p>
                </div>

                <Form method="post" className="flex flex-col gap-5">
                    <label className="flex flex-col gap-2 text-sm font-semibold">
                        Correo electrónico
                        <input name="email" type="email" required maxLength={254} autoComplete="username" placeholder="nombre@clinica.com" className={inputClass} />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-semibold">
                        Contraseña
                        <span className="relative block">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={8}
                                autoComplete="current-password"
                                placeholder="Escribe tu contraseña"
                                className={`${inputClass} pr-12`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(value => !value)}
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                aria-pressed={showPassword}
                                className="absolute inset-y-0 right-2 flex w-10 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-muted hover:text-brand-text focus-visible:outline-2 focus-visible:outline-brand"
                            >
                                {showPassword ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
                            </button>
                        </span>
                    </label>

                    {message && (
                        <p role="alert" className="rounded-xl border border-tone-orange-soft bg-tone-orange-soft px-3 py-3 text-sm text-tone-orange-fg">
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="group relative flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand px-4 font-bold text-on-brand shadow-lg shadow-brand/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:translate-y-0 disabled:cursor-wait disabled:opacity-70"
                    >
                        {submitting ? (
                            <><span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden /> Verificando acceso…</>
                        ) : "Ingresar"}
                    </button>
                    <p className="text-center text-xs text-ink-muted">Acceso exclusivo para el equipo de la veterinaria.</p>
                </Form>
            </div>
        </main>
    );
}
