import { Heart, PawPrint } from "lucide-react";
import { SmartImage } from "~/core/ui/SmartImage";

export const HERO_SRC = "/images/hero/hero-mascotas.png";

export function WelcomeBanner() {
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
        <h1 id="bienvenida" className="text-3xl leading-tight font-bold sm:text-4xl">
          ¡Bienvenido a
          <span className="block text-4xl font-extrabold sm:text-5xl">
            <span className="text-brand">Alfapet</span> Veterinaria!
          </span>
        </h1>
        <p className="mt-3 flex items-center gap-2 text-lg text-ink-muted">
          Cuidamos a quienes te dan amor incondicional
          <Heart className="size-5 shrink-0 fill-brand text-brand" aria-hidden />
        </p>
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
