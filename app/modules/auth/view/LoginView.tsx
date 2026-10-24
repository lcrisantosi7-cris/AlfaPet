import { ArrowRight, Eye, EyeOff, HeartPulse, PawPrint, ShieldCheck, Stethoscope } from "lucide-react";
import { useState } from "react";
import { Form, useNavigation } from "react-router";
import { LOGO_SRC } from "~/core/layout/BrandLogo";
import { SmartImage } from "~/core/ui/SmartImage";

interface LoginViewProps {
  error?: string;
  inactive: boolean;
}

const inputClass =
  "h-[3.15rem] w-full rounded-xl border border-line bg-surface px-4 text-sm text-ink placeholder:text-ink-muted/80 outline-none transition duration-200 hover:border-brand/40 focus:border-brand focus:ring-4 focus:ring-brand/10";

export function LoginView({ error, inactive }: LoginViewProps) {
  const submitting = useNavigation().state !== "idle";
  const [showPassword, setShowPassword] = useState(false);
  const message = error ?? (inactive ? "Tu cuenta está desactivada. Contacta con el administrador." : undefined);

  return (
    <main className="login-shell relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg p-4 sm:p-6 lg:p-8">
      <div aria-hidden className="login-orb login-orb-one" />
      <div aria-hidden className="login-orb login-orb-two" />
      <div className="login-frame relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-line/80 bg-surface shadow-[0_32px_100px_-42px_rgba(74,39,17,.35)] lg:min-h-[680px] lg:grid-cols-[1.02fr_.98fr]">
        <section className="login-brand-panel relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-14">
          <div aria-hidden className="login-panel-pattern" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/10">
              <SmartImage src={LOGO_SRC} alt="" loading="eager" className="size-11 object-cover" fallback={<PawPrint className="size-7 text-brand" aria-hidden />} />
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-tight">AlfaPet</p>
              <p className="text-xs font-medium text-white/70">Gestión veterinaria</p>
            </div>
          </div>

          <div className="relative z-10 max-w-lg pb-4">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold tracking-wide text-white/90 backdrop-blur">
              <HeartPulse className="size-4" aria-hidden /> Plataforma de atención veterinaria
            </span>
            <h1 className="max-w-md text-4xl font-extrabold leading-[1.12] tracking-tight xl:text-5xl">
              Todo el cuidado de tus pacientes, <span className="text-[#ffd3a3]">en un solo lugar.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/75">
              Organiza la agenda, consulta historiales y mantén cada detalle de la clínica bajo control.
            </p>
            <div className="mt-9 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <CalendarBadge />
                <p className="mt-3 text-sm font-semibold">Agenda organizada</p>
                <p className="mt-1 text-xs leading-5 text-white/65">Citas y seguimientos a mano</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <Stethoscope className="size-5 text-[#ffd3a3]" aria-hidden />
                <p className="mt-3 text-sm font-semibold">Atención segura</p>
                <p className="mt-1 text-xs leading-5 text-white/65">Información clínica centralizada</p>
              </div>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-xs text-white/60">
            <ShieldCheck className="size-4" aria-hidden />
            Acceso protegido para el personal autorizado
          </div>
          <PawPrint className="login-paw-decoration absolute -right-8 bottom-24 size-64 rotate-[-18deg] text-white/[0.07]" aria-hidden />
        </section>

        <section className="flex min-w-0 flex-col justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft ring-1 ring-brand/10">
                <SmartImage src={LOGO_SRC} alt="Logo de AlfaPet" loading="eager" className="size-11 object-cover" fallback={<PawPrint className="size-7 text-brand" aria-hidden />} />
              </div>
              <div>
                <p className="text-lg font-extrabold tracking-tight">AlfaPet</p>
                <p className="text-xs text-ink-muted">Gestión veterinaria</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-text">Bienvenido de nuevo</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-[2.1rem]">Inicia sesión</h2>
              <p className="mt-2 text-sm leading-6 text-ink-muted">Ingresa tus credenciales para acceder al panel de la clínica.</p>
            </div>

            <Form method="post" className="flex flex-col gap-5">
              <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
                Correo electrónico
                <input name="email" type="email" required maxLength={254} autoComplete="username" placeholder="nombre@clinica.com" className={inputClass} />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-ink">
                Contraseña
                <span className="relative block">
                  <input name="password" type={showPassword ? "text" : "password"} required minLength={8} autoComplete="current-password" placeholder="Escribe tu contraseña" className={inputClass + " pr-12"} />
                  <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword} className="absolute inset-y-0 right-2 flex w-10 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-muted hover:text-brand-text focus-visible:outline-2 focus-visible:outline-brand">
                    {showPassword ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
                  </button>
                </span>
              </label>

              {message && <p role="alert" className="rounded-xl border border-tone-red-fg/20 bg-tone-red-soft px-4 py-3 text-sm leading-5 text-tone-red-fg">{message}</p>}

              <button type="submit" disabled={submitting} className="ui-button group mt-1 flex h-[3.15rem] items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-on-brand shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:translate-y-0 disabled:cursor-wait disabled:opacity-70">
                {submitting ? <><span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden /> Verificando acceso…</> : <>Entrar al panel <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></>}
              </button>
              <div className="flex items-center justify-center gap-2 pt-1 text-xs text-ink-muted">
                <ShieldCheck className="size-4 text-tone-green-fg" aria-hidden />
                Acceso exclusivo para el equipo de la veterinaria
              </div>
            </Form>
          </div>
          <p className="mt-10 text-center text-[11px] text-ink-muted/80">AlfaPet · Sistema de gestión veterinaria</p>
        </section>
      </div>
    </main>
  );
}

function CalendarBadge() {
  return <PawPrint className="size-5 text-[#ffd3a3]" aria-hidden />;
}
