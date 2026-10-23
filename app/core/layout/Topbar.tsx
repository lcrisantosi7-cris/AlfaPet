import { Bell, ChevronDown, Menu, Search, AlertTriangle, CalendarClock, Package, CheckCheck } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import type { SessionUser } from "~/modules/auth/model/user.types";
import type { AppNotification } from "~/routes/app-layout";
import { Avatar } from "~/core/ui/Avatar";
import { ThemeToggle } from "./ThemeToggle";
import { LogoutButton } from "./LogoutButton";

interface TopbarProps {
  user: SessionUser;
  unreadNotifications: number;
  notifications: AppNotification[];
  onOpenMenu: () => void;
}

export function Topbar({ user, unreadNotifications, notifications, onOpenMenu }: TopbarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-bg/85 px-4 py-3 backdrop-blur lg:px-6">
      <button type="button" onClick={onOpenMenu} aria-label="Abrir menú" className="flex size-11 items-center justify-center rounded-full border border-line bg-surface lg:hidden">
        <Menu className="size-5" aria-hidden />
      </button>
      <form role="search" action="/pacientes" className="relative max-w-xl flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-muted" aria-hidden />
        <input type="search" name="q" maxLength={80} autoComplete="off" aria-label="Buscar paciente, dueño o cita" placeholder="Buscar paciente, dueño o cita…" className="h-12 w-full rounded-full border border-line bg-surface pr-4 pl-12 text-sm placeholder:text-ink-muted" />
      </form>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <div className="relative">
          <button
            type="button"
            aria-label={`Notificaciones: ${unreadNotifications} alertas activas`}
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen(value => !value)}
            className="relative flex size-11 items-center justify-center rounded-full border border-line bg-surface text-ink-muted transition hover:border-brand hover:text-brand-text focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Bell className="size-5" aria-hidden />
            {unreadNotifications > 0 && <span className="absolute -top-1 -right-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-brand px-1 text-[0.7rem] font-bold text-on-brand">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}
          </button>
          {notificationsOpen && <>
            <button type="button" aria-label="Cerrar notificaciones" onClick={() => setNotificationsOpen(false)} className="fixed inset-0 z-40 cursor-default" />
            <section aria-label="Centro de notificaciones" className="absolute right-0 z-50 mt-3 w-[min(90vw,390px)] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/15">
              <header className="flex items-center justify-between border-b border-line px-4 py-3">
                <div><h2 className="font-bold">Notificaciones</h2><p className="text-xs text-ink-muted">{notifications.length} alertas operativas</p></div>
                <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-text">En vivo</span>
              </header>
              {notifications.length === 0 ? <div className="px-5 py-9 text-center"><CheckCheck className="mx-auto size-8 text-tone-green-fg" /><p className="mt-2 font-semibold">Todo está al día</p><p className="mt-1 text-sm text-ink-muted">No hay alertas de stock ni citas próximas.</p></div> :
                <ul className="max-h-[min(65vh,460px)] overflow-y-auto divide-y divide-line">
                  {notifications.map(item => {
                    const Icon = item.severity === "alert" ? AlertTriangle : item.severity === "moderate" ? Package : CalendarClock;
                    const tone = item.severity === "alert" ? "text-tone-red-fg bg-tone-red-soft" : item.severity === "moderate" ? "text-tone-amber-fg bg-tone-amber-soft" : "text-brand-text bg-brand-soft";
                    return <li key={item.id}><Link to={item.href} onClick={() => setNotificationsOpen(false)} className="flex gap-3 px-4 py-3 transition hover:bg-surface-muted"><span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="size-4" /></span><span className="min-w-0"><span className="block text-sm font-semibold">{item.title}</span><span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{item.description}</span></span></Link></li>;
                  })}
                </ul>}
              <footer className="border-t border-line px-4 py-3 text-xs text-ink-muted">Las alertas se actualizan al cargar o navegar por la aplicación.</footer>
            </section>
          </>}
        </div>
        <Link to="/configuracion" className="flex items-center gap-3 rounded-full py-1 pr-2 pl-1 transition hover:bg-surface">
          <Avatar name={user.name} src={user.avatarUrl} />
          <span className="hidden text-left leading-tight sm:block"><span className="block text-sm font-bold">{user.name}</span><span className="block text-xs text-ink-muted">{user.jobTitle}</span></span>
          <ChevronDown className="hidden size-4 text-ink-muted sm:block" aria-hidden />
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}
