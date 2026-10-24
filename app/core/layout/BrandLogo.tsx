import { PawPrint } from "lucide-react";
import { SmartImage } from "~/core/ui/SmartImage";

export const LOGO_SRC = "/images/brand/logo-alfapet.jpeg";

export function BrandLogo() {
  return (
    <div className="px-5 pt-6 pb-5">
      <div className="flex items-center gap-3">
        <SmartImage
          src={LOGO_SRC}
          alt="AlfaPet"
          loading="eager"
          className="size-14 shrink-0 rounded-2xl object-cover ring-1 ring-white/15"
          fallback={
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-text">
              <PawPrint className="size-7" aria-hidden />
            </span>
          }
        />
        <div className="min-w-0">
          <p className="text-lg font-extrabold tracking-tight text-white">AlfaPet</p>
          <p className="mt-0.5 text-[0.68rem] font-medium tracking-wide text-sidebar-ink/55">
            CLÍNICA VETERINARIA
          </p>
        </div>
      </div>
      <div className="mt-5 h-px bg-white/10" />
    </div>
  );
}