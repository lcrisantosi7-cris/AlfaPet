import { ArrowRight, CalendarDays, PawPrint, ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { SmartImage } from "~/core/ui/SmartImage";

export const HERO_SRC = "/images/brand/logo-alfapet.jpeg";

interface WelcomeBannerProps {
  firstName: string;
  appointmentsToday: number;
  action: ReactNode;
}

function todaySummary(count: number) {
  if (count === 0) return "No hay citas programadas para hoy. Puedes revisar la agenda o registrar una nueva atención.";
  return count === 1 ? "Tienes 1 cita programada para hoy. Revisa los detalles antes de atender." : `Tienes ${count} citas programadas para hoy. Revisa tu agenda y prepara las atenciones.`;
}

export function WelcomeBanner({ firstName, appointmentsToday, action }: WelcomeBannerProps) {
  return (
    <section aria-labelledby="bienvenida" className="relative isolate overflow-hidden rounded-[1.75rem] border border-line bg-gradient-to-br from-brand-soft via-surface to-surface px-6 py-7 shadow-card sm:px-9 sm:py-9">
      <div aria-hidden className="absolute -right-12 -top-16 -z-10 size-64 rounded-full bg-brand/10 blur-2xl" />
      <div aria-hidden className="absolute right-1/4 -bottom-24 -z-10 size-56 rounded-full bg-brand/10 blur-2xl" />
      <PawPrint aria-hidden className="absolute right-[42%] top-8 size-5 -rotate-12 text-brand/40" />
      <Sparkles aria-hidden className="absolute right-8 top-7 size-5 text-brand/50" />

      <div className="relative z-10 max-w-xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1.5 text-xs font-semibold text-brand-text">
          <ShieldCheck className="size-4" aria-hidden />
          Panel de gestión veterinaria
        </div>
        <h1 id="bienvenida" className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
          ¡Hola, <span className="text-brand">{firstName}</span>!
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-ink-muted sm:text-base">{todaySummary(appointmentsToday)}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {action}
          <Link to="/citas" className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold transition hover:border-brand/40 hover:bg-surface-muted">
            <CalendarDays className="size-4 text-brand-text" aria-hidden />
            Ver agenda
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] items-end justify-center md:flex">
        <div aria-hidden className="absolute bottom-0 right-0 h-3/4 w-full rounded-tl-[9rem] bg-brand/10" />
        <SmartImage
          src={HERO_SRC}
          alt=""
          loading="eager"
          className="relative z-10 max-h-64 w-full object-contain object-bottom drop-shadow-sm"
          fallback={<div className="mb-8 mr-8 flex size-40 items-center justify-center rounded-full bg-brand/10 text-brand"><PawPrint className="size-20" /></div>}
        />
      </div>
    </section>
  );
}
