import { ChevronDown, Menu, Search } from "lucide-react";
import { Link } from "react-router";
import type { SessionUser } from "~/modules/auth/model/user.types";
import type { AppNotification } from "~/routes/app-layout";
import { Avatar } from "~/core/ui/Avatar";
import { ThemeToggle } from "./ThemeToggle";
import { LogoutButton } from "./LogoutButton";
import { NotificationCenter } from "./NotificationCenter";

interface TopbarProps {
  user: SessionUser;
  unreadNotifications: number;
  notifications: AppNotification[];
  onOpenMenu: () => void;
}

export function Topbar({
  user,
  unreadNotifications,
  notifications,
  onOpenMenu,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line/60 bg-bg/85 px-4 py-3 backdrop-blur lg:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menú"
        className="ui-icon-button flex size-11 items-center justify-center rounded-full border border-line bg-surface lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <form role="search" action="/pacientes" className="relative max-w-xl flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-muted"
          aria-hidden
        />
        <input
          type="search"
          name="q"
          maxLength={80}
          autoComplete="off"
          aria-label="Buscar paciente, dueño o cita"
          placeholder="Buscar paciente, dueño o cita…"
          className="ui-field h-12 w-full rounded-full border border-line bg-surface pr-4 pl-12 text-sm placeholder:text-ink-muted"
        />
      </form>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <NotificationCenter
          unreadNotifications={unreadNotifications}
          notifications={notifications}
        />
        <Link
          to="/configuracion"
          className="ui-profile-link flex items-center gap-3 rounded-full py-1 pr-2 pl-1"
        >
          <Avatar name={user.name} src={user.avatarUrl} />
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-bold">{user.name}</span>
            <span className="block text-xs text-ink-muted">{user.jobTitle}</span>
          </span>
          <ChevronDown className="hidden size-4 text-ink-muted sm:block" aria-hidden />
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}