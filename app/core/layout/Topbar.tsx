import { ChevronDown, Menu, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { cn } from "~/core/lib/cn";
import { Avatar } from "~/core/ui/Avatar";
import type { SessionUser } from "~/modules/auth/model/user.types";
import type { AppNotification } from "~/routes/app-layout";
import { LogoutButton } from "./LogoutButton";
import { NotificationCenter } from "./NotificationCenter";
import { ThemeToggle } from "./ThemeToggle";

interface TopbarProps {
  user: SessionUser;
  unreadNotifications: number;
  notifications: AppNotification[];
  onOpenMenu: () => void;
}

export function Topbar({ user, unreadNotifications, notifications, onOpenMenu }: TopbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if ((event.target as HTMLElement).closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center gap-3 border-b border-line/60 px-4 py-3 backdrop-blur transition-[box-shadow,background-color] duration-300 lg:px-6",
        scrolled ? "bg-bg/95 shadow-[0_12px_30px_-22px_rgb(46_30_18/0.55)]" : "bg-bg/85",
      )}
    >
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menú"
        className="ui-icon-button flex size-11 items-center justify-center rounded-full border border-line bg-surface lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <form
        role="search"
        action="/pacientes"
        className="group/search relative max-w-xl flex-1 transition-[max-width] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] focus-within:max-w-2xl"
      >
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-muted transition-colors group-focus-within/search:text-brand"
          aria-hidden
        />
        <input
          ref={searchRef}
          type="search"
          name="q"
          maxLength={80}
          autoComplete="off"
          aria-label="Buscar paciente, dueño o cita"
          placeholder="Buscar paciente, dueño o cita…"
          className="ui-field h-12 w-full rounded-full border border-line bg-surface pr-12 pl-12 text-sm placeholder:text-ink-muted"
        />
        <kbd
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 rounded-md border border-line bg-surface-muted px-1.5 py-0.5 text-[0.65rem] font-semibold text-ink-muted transition-opacity group-focus-within/search:opacity-0 sm:block"
        >
          /
        </kbd>
      </form>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <NotificationCenter unreadNotifications={unreadNotifications} notifications={notifications} />
        <Link to="/configuracion" className="ui-profile-link group flex items-center gap-3 rounded-full py-1 pr-2 pl-1">
          <Avatar name={user.name} src={user.avatarUrl} className="ring-2 ring-transparent transition group-hover:ring-brand/40" />
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-bold">{user.name}</span>
            <span className="block text-xs text-ink-muted">{user.jobTitle}</span>
          </span>
          <ChevronDown className="hidden size-4 text-ink-muted transition-transform group-hover:translate-y-0.5 sm:block" aria-hidden />
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}