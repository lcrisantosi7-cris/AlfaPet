import { PawPrint } from "lucide-react";
import { cn } from "~/core/lib/cn";
import { SmartImage } from "~/core/ui/SmartImage";

export const LOGO_SRC = "/images/brand/logo-alfapet.jpeg";

export function BrandLogo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={cn("pt-6 pb-5", collapsed ? "px-0" : "px-5")}>
      <div className={cn("group flex items-center gap-3", collapsed && "justify-center")}>
        <SmartImage
          src={LOGO_SRC}
          alt="AlfaPet"
          loading="eager"
          className={cn(
            "shrink-0 rounded-2xl object-cover ring-1 ring-white/15 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105",
            collapsed ? "size-11" : "size-14",
          )}
          fallback={
            <span className={cn("flex shrink-0 items-center justify-center rounded-2xl bg-white text-brand-text", collapsed ? "size-11" : "size-14")}>
              <PawPrint className="size-7" aria-hidden />
            </span>
          }
        />
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-lg font-extrabold tracking-tight text-white">AlfaPet</p>
            <p className="mt-0.5 text-[0.68rem] font-medium tracking-wide text-sidebar-ink/55">CLÍNICA VETERINARIA</p>
          </div>
        )}
      </div>
      {!collapsed && <div className="mt-5 h-px bg-white/10" />}
    </div>
  );
}