import { AlertCircle, AlertTriangle, ArrowRight, Eye, EyeOff, Lock, Mail, PawPrint, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Form, useNavigation } from "react-router";
import { LOGO_SRC } from "~/core/layout/BrandLogo";
import { SmartImage } from "~/core/ui/SmartImage";
import { LoginMascot, type DogMood } from "./LoginMascot";
import { LoginShowcase } from "./LoginShowcase";

interface LoginViewProps {
  error?: string;
  inactive: boolean;
}

const inputClass =
  "h-[3.15rem] w-full rounded-xl border border-line bg-bg pl-11 pr-4 text-sm text-ink placeholder:text-ink-muted/80 outline-none transition duration-200 hover:border-brand/40 focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10";
const iconClass =
  "pointer-events-none absolute top-1/2 left-4 size-[1.15rem] -translate-y-1/2 text-ink-muted transition-colors group-focus-within:text-brand";

function useGreeting() {
  const [greeting, setGreeting] = useState("Bienvenido de nuevo");
  useEffect(() => {
    const hour = Number(
      new Intl.DateTimeFormat("es-PE", { hour: "numeric", hourCycle: "h23", timeZone: "America/Lima" }).format(new Date()),
    );
    setGreeting(hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches");
  }, []);
  return greeting;
}

export function LoginView({ error, inactive }: LoginViewProps) {
  const submitting = useNavigation().state !== "idle";
  const [showPassword, setShowPassword] = useState(false);
  const [focus, setFocus] = useState<"email" | "password" | null>(null);
  const [emailLength, setEmailLength] = useState(0);
  const [capsLock, setCapsLock] = useState(false);
  const greeting = useGreeting();
  const message = error ?? (inactive ? "Tu cuenta está desactivada. Contacta con el administrador." : undefined);

  const mood: DogMood = submitting
    ? "loading"
    : focus === "password"
      ? showPassword ? "peek" : "cover"
      : message ? "error" : "idle";
  const lookAt = focus === "email" ? { x: Math.max(-1, Math.min(1, emailLength / 14 - 1)), y: 0.75 } : null;

  return (
    <main className="login-shell relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg p-4 sm:p-6 lg:p-8">
      <div aria-hidden className="login-orb login-orb-one" />
      <div aria-hidden className="login-orb login-orb-two" />

      <div className="login-frame relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-line/80 bg-surface shadow-[0_32px_100px_-42px_rgba(74,39,17,.35)] lg:min-h-[700px] lg:grid-cols-[1.05fr_.95fr]">
        <LoginShowcase />

        <section className="flex min-w-0 flex-col justify-center bg-gradient-to-b from-surface to-surface-muted px-5 py-9 sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-4 flex items-center justify-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-brand-soft ring-1 ring-brand/10">
                <SmartImage src={LOGO_SRC} alt="Logo de AlfaPet" loading="eager" className="size-9 object-cover" fallback={<PawPrint className="size-6 text-brand" aria-hidden />} />
              </div>
              <p className="text-lg font-extrabold tracking-tight">AlfaPet</p>
            </div>

            <LoginMascot mood={mood} lookAt={lookAt} />

            <div className="relative z-10 -mt-px rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
              <p className="text-xs font-bold tracking-[0.18em] text-brand-text uppercase">{greeting}</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Inicia sesión</h2>
              <p className="mt-2 text-sm leading-6 text-ink-muted">Entra al panel para atender a los pacientes de hoy.</p>

              <Form method="post" className="mt-7 flex flex-col gap-5">
                <label className="group flex flex-col gap-2 text-sm font-semibold text-ink">
                  Correo electrónico
                  <span className="relative block">
                    <Mail className={iconClass} aria-hidden />
                    <input
                      name="email"
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="username"
                      placeholder="nombre@clinica.com"
                      className={inputClass}
                      onFocus={() => setFocus("email")}
                      onBlur={() => setFocus(null)}
                      onChange={(event) => setEmailLength(event.target.value.length)}
                    />
                  </span>
                </label>

                <label className="group flex flex-col gap-2 text-sm font-semibold text-ink">
                  Contraseña
                  <span
                    className="relative block"
                    onFocus={() => setFocus("password")}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) {
                        setFocus(null);
                        setCapsLock(false);
                      }
                    }}
                  >
                    <Lock className={iconClass} aria-hidden />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="current-password"
                      placeholder="Escribe tu contraseña"
                      className={inputClass + " pr-12"}
                      onKeyDown={(event) => setCapsLock(event.getModifierState("CapsLock"))}
                      onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-2 flex w-10 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-muted hover:text-brand-text focus-visible:outline-2 focus-visible:outline-brand"
                    >
                      {showPassword ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
                    </button>
                  </span>
                  {capsLock && (
                    <span role="status" className="login-chip flex items-center gap-1.5 text-xs font-semibold text-tone-amber-fg">
                      <AlertTriangle className="size-3.5" aria-hidden /> Tienes las mayúsculas activadas
                    </span>
                  )}
                </label>

                {message && (
                  <p
                    key={message}
                    role="alert"
                    className="login-shake flex items-start gap-2.5 rounded-xl border border-tone-red-fg/20 bg-tone-red-soft px-4 py-3 text-sm leading-5 text-tone-red-fg"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="login-submit ui-button group mt-1 flex h-[3.15rem] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-[#ff9a2e] px-4 text-sm font-bold text-on-brand shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-80"
                >
                  {submitting ? (
                    <>
                      <PawPrint className="size-4 animate-bounce" aria-hidden /> Verificando acceso…
                    </>
                  ) : (
                    <>
                      Entrar al panel <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </>
                  )}
                </button>

                <p className="flex items-center justify-center gap-2 pt-1 text-xs text-ink-muted">
                  <ShieldCheck className="size-4 text-tone-green-fg" aria-hidden />
                  Acceso exclusivo para el equipo de la veterinaria
                </p>
              </Form>
            </div>
          </div>
          <p className="mt-8 text-center text-[11px] text-ink-muted/80">AlfaPet · Sistema de gestión veterinaria</p>
        </section>
      </div>
    </main>
  );
}