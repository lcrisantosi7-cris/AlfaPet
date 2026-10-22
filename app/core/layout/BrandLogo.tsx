import { PawPrint } from "lucide-react";
import { SmartImage } from "~/core/ui/SmartImage";

export const LOGO_SRC = "/images/brand/logo-alfapet.png";

export function BrandLogo() {
  return (
    <div className="flex justify-center px-6 pt-8 pb-6">
      <SmartImage
        src={LOGO_SRC}
        alt="Alfapet Veterinaria"
        loading="eager"
        className="size-32 rounded-full object-cover"
        fallback={
          <div className="flex size-32 flex-col items-center justify-center rounded-full bg-white text-brand-text">
            <PawPrint className="size-8" aria-hidden />
            <span className="text-xl font-extrabold">Alfapet</span>
            <span className="text-[0.65rem] font-semibold tracking-wide">VETERINARIA</span>
          </div>
        }
      />
    </div>
  );
}
