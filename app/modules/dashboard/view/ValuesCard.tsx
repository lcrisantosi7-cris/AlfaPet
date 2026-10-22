import { Heart } from "lucide-react";

export function ValuesCard() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-brand-soft px-5 py-8 text-center">
      <Heart className="size-10 text-brand" aria-hidden />
      <p className="text-sm text-ink-muted">Salud • Bienestar • Amor</p>
      <span aria-hidden className="mt-1 h-0.5 w-12 rounded-full bg-brand" />
    </div>
  );
}
