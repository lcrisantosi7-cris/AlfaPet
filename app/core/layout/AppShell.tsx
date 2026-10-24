import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigation } from "react-router";
import type { NavItem } from "~/core/config/navigation";
import { cn } from "~/core/lib/cn";
import type { SessionUser } from "~/modules/auth/model/user.types";
import type { AppNotification } from "~/routes/app-layout";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppShellProps {
  user: SessionUser;
  navItems: readonly NavItem[];
  unreadNotifications: number;
  notifications: AppNotification[];
  children: ReactNode;
}

export function AppShell({ user, navItems, unreadNotifications, notifications, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigation = useNavigation();
  const location = useLocation();
  const isNavigating = navigation.state !== "idle";

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (isNavigating) {
      document.documentElement.dataset.navigation = "loading";
    } else {
      delete document.documentElement.dataset.navigation;
    }
    return () => {
      delete document.documentElement.dataset.navigation;
    };
  }, [isNavigating]);

  return (
    <div className="min-h-dvh">
      <div
        className={cn("app-navigation-progress", isNavigating && "is-active")}
        role="progressbar"
        aria-label="Cargando página"
        aria-valuetext={isNavigating ? "Cargando contenido" : "Carga finalizada"}
        aria-hidden={!isNavigating}
      >
        <span />
      </div>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand"
      >
        Saltar al contenido
      </a>

      {/* Escritorio */}
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 lg:block", sidebarCollapsed ? "w-[5.25rem]" : "w-64")}>
        <Sidebar items={navItems} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((value) => !value)} />
      </aside>

      {/* Móvil */}
      <div
        onClick={() => setMenuOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        inert={!menuOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transition-transform lg:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar items={navItems} onNavigate={() => setMenuOpen(false)} />
      </aside>

      <div className={cn("transition-[padding] duration-200", sidebarCollapsed ? "lg:pl-[5.25rem]" : "lg:pl-64")}>
        <Topbar
          user={user}
          unreadNotifications={unreadNotifications}
          notifications={notifications}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <main id="contenido" aria-busy={isNavigating} className="px-4 pt-2 pb-8 lg:px-6">
          <div key={location.pathname} className="route-content-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
