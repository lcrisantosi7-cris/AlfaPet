import { Activity, CircleCheck } from "lucide-react";
import { NavLink } from "react-router";
import type { NavItem } from "~/core/config/navigation";
import { cn } from "~/core/lib/cn";
import { BrandLogo } from "./BrandLogo";
import { NAV_ICONS } from "./nav-icons";

interface SidebarProps {
  items: readonly NavItem[];
  onNavigate?: () => void;
}

export function Sidebar({ items, onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full flex-col overflow-y-auto border-r border-white/10 bg-sidebar text-sidebar-ink">
      <BrandLogo />

      <nav aria-label="Navegación principal" className="px-3 pb-5">
        <p className="mb-3 px-4 text-[0.65rem] font-bold tracking-[0.16em] text-sidebar-ink/50 uppercase">
          Menú principal
        </p>
        <ul className="flex flex-col gap-1">
          {items.map((item, index) => {
            const Icon = NAV_ICONS[item.icon];
            const isSectionStart = ["reportes", "configuracion"].includes(item.key);

            return (
              <li key={item.key} className={isSectionStart ? "mt-3 border-t border-white/10 pt-3" : undefined}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "ui-nav-link group relative flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium",
                      isActive
                        ? "bg-white text-[#3b1d0e] shadow-sm"
                        : "text-sidebar-ink/75 hover:bg-white/8 hover:text-sidebar-ink",
                    )
                  }
                >
                  <Icon className="ui-nav-icon size-[1.1rem] shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full bg-current opacity-0 transition-opacity group-[aria-current=page]:opacity-100"
                  />
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <SidebarFooter />
    </div>
  );
}

function SidebarFooter() {
  return (
    <div className="mt-auto px-4 pb-5 pt-4">
      <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-sidebar-ink">
            <Activity className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-sidebar-ink">AlfaPet</p>
            <p className="mt-0.5 text-[0.68rem] text-sidebar-ink/55">Gestión veterinaria</p>
          </div>
          <CircleCheck className="size-4 text-emerald-300" aria-label="Sistema disponible" />
        </div>
      </div>
    </div>
  );
}