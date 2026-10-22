import { useEffect, useState, type ReactNode } from "react";
import type { NavItem } from "~/core/config/navigation";
import { cn } from "~/core/lib/cn";
import type { SessionUser } from "~/modules/auth/model/user.types";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppShellProps {
  user: SessionUser;
  navItems: readonly NavItem[];
  unreadNotifications: number;
  children: ReactNode;
}

export function AppShell({ user, navItems, unreadNotifications, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <div className="min-h-dvh">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand"
      >
        Saltar al contenido
      </a>

      {/* Escritorio */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <Sidebar items={navItems} />
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

      <div className="lg:pl-64">
        <Topbar
          user={user}
          unreadNotifications={unreadNotifications}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <main id="contenido" className="px-4 pt-2 pb-8 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
