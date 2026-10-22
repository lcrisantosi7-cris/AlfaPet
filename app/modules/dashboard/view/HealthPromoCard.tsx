import { Heart, PawPrint } from "lucide-react";
import { Link } from "react-router";

export function HealthPromoCard() {
  return (
    <section
      aria-labelledby="promo-salud"
      className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-card"
    >
      <div aria-hidden className="absolute -right-8 -bottom-10 size-40 rounded-full bg-brand-soft" />
      <Heart
        aria-hidden
        className="absolute right-6 bottom-6 size-14 rounded-full border-4 border-brand p-3 text-brand"
      />

      <div className="relative flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand">
          <PawPrint className="size-5" aria-hidden />
        </span>
        <h2 id="promo-salud" className="text-lg leading-snug font-bold">
          Una vida más sana para tu mascota
        </h2>
      </div>
      <p className="relative mt-3 max-w-[14rem] text-sm text-ink-muted">
        Con nuestros servicios y cuidados especializados.
      </p>
      <Link
        to="/citas"
        className="relative mt-4 inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand shadow-md shadow-brand/30 hover:opacity-90"
      >
        Ver servicios
      </Link>
    </section>
  );
}
