import { AlertTriangle, Bell, CalendarClock, CheckCheck, Package } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { AppNotification } from "~/routes/app-layout";

interface NotificationCenterProps {
  unreadNotifications: number;
  notifications: AppNotification[];
}

function notificationAppearance(severity: AppNotification["severity"]) {
  if (severity === "alert") {
    return { Icon: AlertTriangle, tone: "text-tone-red-fg bg-tone-red-soft" };
  }
  if (severity === "moderate") {
    return { Icon: Package, tone: "text-tone-amber-fg bg-tone-amber-soft" };
  }
  return { Icon: CalendarClock, tone: "text-brand-text bg-brand-soft" };
}

export function NotificationCenter({
  unreadNotifications,
  notifications,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={"Notificaciones: " + unreadNotifications + " alertas activas"}
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={() => setOpen((value) => !value)}
        className="ui-icon-button relative flex size-11 items-center justify-center rounded-full border border-line bg-surface text-ink-muted hover:border-brand hover:text-brand-text"
      >
        <Bell className="size-5" aria-hidden />
        {unreadNotifications > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[0.7rem] font-bold text-on-brand">
            {unreadNotifications > 99 ? "99+" : unreadNotifications}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar notificaciones"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <section
            id="notification-panel"
            aria-label="Centro de notificaciones"
            className="ui-popover-enter absolute right-0 z-50 mt-3 w-[min(90vw,390px)] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/15"
          >
            <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div>
                <h2 className="font-bold">Notificaciones</h2>
                <p className="text-xs text-ink-muted">{notifications.length} alertas operativas</p>
              </div>
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-text">
                En vivo
              </span>
            </header>

            {notifications.length === 0 ? (
              <div className="px-5 py-9 text-center">
                <CheckCheck className="mx-auto size-8 text-tone-green-fg" aria-hidden />
                <p className="mt-2 font-semibold">Todo está al día</p>
                <p className="mt-1 text-sm text-ink-muted">No hay alertas de stock ni citas próximas.</p>
              </div>
            ) : (
              <ul className="max-h-[min(65vh,460px)] divide-y divide-line overflow-y-auto">
                {notifications.map((item) => {
                  const appearance = notificationAppearance(item.severity);
                  const Icon = appearance.Icon;

                  return (
                    <li key={item.id}>
                      <Link
                        to={item.href}
                        onClick={() => setOpen(false)}
                        className="flex gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
                      >
                        <span className={"mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl " + appearance.tone}>
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{item.title}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            <footer className="border-t border-line px-4 py-3 text-xs text-ink-muted">
              Las alertas se actualizan al cargar o navegar por la aplicación.
            </footer>
          </section>
        </>
      )}
    </div>
  );
}