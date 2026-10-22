import { PawPrint } from "lucide-react";
import type { ReactNode } from "react";
import { SmartImage } from "~/core/ui/SmartImage";

export const HERO_SRC = "/images/hero/hero-mascotas.png";

interface WelcomeBannerProps {
  firstName: string;
  appointmentsToday: number;
  action: ReactNode;
}

function todaySummary(count: number) {
  if (count === 0) return "No hay citas programadas para hoy.";
  return count === 1 ? "Hay 1 cita programada para hoy." : `Hay ${count} citas programadas para hoy.`;
}

export function WelcomeBanner({ firstName, appointmentsToday, action }: WelcomeBannerProps) {
  return (
    <section
      aria-labelledby="bienvenida"
      className="relative flex min-h-48 items-center overflow-hidden rounded-3xl bg-brand-soft px-6 py-8 sm:px-10"
    >
      <div
        aria-hidden
        className="absolute -right-10 -bottom-24 h-64 w-3/5 rounded-[50%_40%_0_0] bg-brand/90"
      />
      <PawPrint aria-hidden className="absolute top-5 right-1/3 size-6 -rotate-12 text-brand/50" />

      <div className="relative z-10 max-w-md">
        <h1 id="bienvenida" className="text-3xl leading-tight font-extrabold sm:text-4xl">
          ¡Hola, <span className="text-brand">{firstName}</span>!
        </h1>
        <p className="mt-2 mb-5 text-lg text-ink-muted">{todaySummary(appointmentsToday)}</p>
        {action}
      </div>

      <SmartImage
        src={HERO_SRC}
        alt=""
        loading="eager"
        className="absolute right-0 bottom-0 z-10 hidden h-full max-h-60 w-auto object-contain md:block"
      />
    </section>
  );
}