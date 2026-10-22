import { Heart, PawPrint } from "lucide-react";
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
    <div className="flex h-full flex-col overflow-y-auto bg-linear-to-b from-sidebar to-sidebar-deep text-sidebar-ink">
      <BrandLogo />

      <nav aria-label="Principal" className="px-3">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            return (
              <li key={item.key}>
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-brand text-on-brand shadow-lg shadow-black/20"
                        : "text-sidebar-ink/85 hover:bg-white/10",
                    )
                  }
                >
                  <Icon className="size-5" aria-hidden />
                  {item.label}
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
    <div className="relative mt-auto h-52 shrink-0">
      <svg
        aria-hidden
        viewBox="0 0 256 120"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-28 w-full text-brand"
      >
        <path fill="currentColor" d="M0 50C50 10 90 30 130 55s90 30 126 5v60H0z" />
      </svg>
      <div className="absolute inset-x-0 top-3 -rotate-6 px-6 text-center text-sm italic text-sidebar-ink">
        <PawPrint className="mx-auto mb-1 size-5 text-brand" aria-hidden />
        Más que una clínica, una familia para tu mascota
        <Heart className="mx-auto mt-1 size-4 fill-brand text-brand" aria-hidden />
      </div>
    </div>
  );
}
