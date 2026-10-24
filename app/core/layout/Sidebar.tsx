import { Activity, ChevronsLeft, ChevronsRight } from "lucide-react";
import { NavLink } from "react-router";
import type { NavItem } from "~/core/config/navigation";
import { cn } from "~/core/lib/cn";
import { BrandLogo } from "./BrandLogo";
import { NAV_ICONS } from "./nav-icons";

interface SidebarProps {
  items: readonly NavItem[];
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ items, onNavigate, collapsed = false, onToggleCollapse }: SidebarProps) {
  return (
    <div className="flex h-full flex-col overflow-y-auto border-r border-white/10 bg-sidebar text-sidebar-ink">
      <div className={cn("flex items-center", collapsed ? "justify-center px-2" : "justify-between pr-3")}>
        <BrandLogo />
        {onToggleCollapse && (
          <button type="button" onClick={onToggleCollapse} aria-label={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"} aria-expanded={!collapsed} className="ui-icon-button hidden size-9 shrink-0 items-center justify-center rounded-xl text-sidebar-ink/70 hover:bg-white/10 hover:text-sidebar-ink lg:flex">
            {collapsed ? <ChevronsRight className="size-4" aria-hidden /> : <ChevronsLeft className="size-4" aria-hidden />}
          </button>
        )}
      </div>

      <nav aria-label="Navegación principal" className={cn("pb-5", collapsed ? "px-2" : "px-3")}>
        {!collapsed && <p className="mb-3 px-4 text-[0.65rem] font-bold tracking-[0.16em] text-sidebar-ink/50 uppercase">Menú principal</p>}
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            const isSectionStart = ["reportes", "configuracion"].includes(item.key);

            return (
              <li key={item.key} className={isSectionStart ? cn("mt-3 pt-3", !collapsed && "border-t border-white/10") : undefined}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "ui-nav-link group relative flex min-h-11 items-center gap-3 rounded-xl py-2.5 text-sm font-medium",
                      collapsed ? "justify-center px-0" : "px-4",
                      isActive
                        ? "bg-white text-[#3b1d0e] shadow-sm"
                        : "text-sidebar-ink/75 hover:bg-white/8 hover:text-sidebar-ink",
                    )
                  }
                >
                  <Icon className="ui-nav-icon size-[1.1rem] shrink-0" aria-hidden />
                  {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                  {collapsed && <span className="pointer-events-none absolute left-[4.5rem] z-50 hidden whitespace-nowrap rounded-lg bg-sidebar px-3 py-2 text-xs font-semibold text-sidebar-ink shadow-xl group-hover:block">{item.label}</span>}
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

      <SidebarFooter collapsed={collapsed} />
    </div>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("mt-auto pb-5 pt-4", collapsed ? "px-2" : "px-4")}>
      <div className={cn("rounded-2xl border border-white/10 bg-black/10 p-3", collapsed && "flex justify-center")}>
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-sidebar-ink">
            <Activity className="size-4" aria-hidden />
          </span>
          {!collapsed && <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-sidebar-ink">AlfaPet</p>
            <p className="mt-0.5 text-[0.68rem] text-sidebar-ink/55">Gestión veterinaria</p>
          </div>}
          {!collapsed && <span className="size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />}
        </div>
      </div>
    </div>
  );
}