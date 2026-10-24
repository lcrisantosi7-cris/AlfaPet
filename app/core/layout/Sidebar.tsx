import { ChevronsLeft, ChevronsRight, PawPrint } from "lucide-react";
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
    <div
      className={cn(
        "flex h-full flex-col border-r border-white/10 bg-sidebar text-sidebar-ink",
        collapsed ? "overflow-visible" : "overflow-y-auto",
      )}
    >
      <div className={cn("flex", collapsed ? "flex-col items-center pb-2" : "items-center justify-between pr-3")}>
        <BrandLogo collapsed={collapsed} />
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
            aria-expanded={!collapsed}
            className="ui-icon-button hidden size-9 shrink-0 items-center justify-center rounded-xl text-sidebar-ink/70 hover:bg-white/10 hover:text-sidebar-ink lg:flex"
          >
            {collapsed ? <ChevronsRight className="size-4" aria-hidden /> : <ChevronsLeft className="size-4" aria-hidden />}
          </button>
        )}
      </div>

      <nav aria-label="Navegación principal" className={cn("pb-5", collapsed ? "px-2" : "px-3")}>
        {!collapsed && (
          <p className="mb-3 px-4 text-[0.65rem] font-bold tracking-[0.16em] text-sidebar-ink/50 uppercase">Menú principal</p>
        )}
        <ul className="flex flex-col gap-1">
          {items.map((item, index) => {
            const Icon = NAV_ICONS[item.icon];
            const isSectionStart = ["reportes", "configuracion"].includes(item.key);

            return (
              <li
                key={item.key}
                className={cn("sidebar-item-in", isSectionStart && cn("mt-3 pt-3", !collapsed && "border-t border-white/10"))}
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "ui-nav-link group relative flex min-h-11 items-center gap-3 rounded-xl py-2.5 text-sm font-medium",
                      collapsed ? "justify-center px-0" : "px-4",
                      isActive
                        ? cn("nav-active bg-white text-[#3b1d0e] shadow-sm", collapsed && "nav-active-collapsed")
                        : "text-sidebar-ink/75 hover:bg-white/8 hover:text-sidebar-ink",
                    )
                  }
                >
                  <Icon className="ui-nav-icon size-[1.1rem] shrink-0" aria-hidden />
                  {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                  {collapsed && (
                    <span className="pointer-events-none invisible absolute left-[4.5rem] z-50 -translate-x-1 whitespace-nowrap rounded-lg bg-sidebar-deep px-3 py-2 text-xs font-semibold text-sidebar-ink opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:visible group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                      {item.label}
                    </span>
                  )}
                  {!collapsed && (
                    <span
                      aria-hidden
                      className="size-1.5 shrink-0 rounded-full bg-current opacity-0 transition-opacity group-aria-[current=page]:opacity-100"
                    />
                  )}
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
    <div className={cn("mt-auto pt-4 pb-5", collapsed ? "px-2" : "px-4")}>
      <div className={cn("rounded-2xl border border-white/10 bg-black/10 p-3", collapsed && "flex justify-center")}>
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-sidebar-ink">
            <PawPrint className="size-4" aria-hidden />
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-sidebar-ink">AlfaPet</p>
              <p className="mt-0.5 text-[0.68rem] text-sidebar-ink/55">Sistema en línea</p>
            </div>
          )}
          {!collapsed && <span className="ui-dot-pulse size-1.5 shrink-0 rounded-full bg-[#4ade80] text-[#4ade80]" aria-hidden />}
        </div>
      </div>
    </div>
  );
}