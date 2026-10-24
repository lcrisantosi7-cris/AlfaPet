import { AlertTriangle, Bell, CalendarClock, CheckCheck, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { cn } from "~/core/lib/cn";
import type { AppNotification } from "~/routes/app-layout";

interface NotificationCenterProps {
  unreadNotifications: number;
  notifications: AppNotification[];
}

function notificationAppearance(severity: AppNotification["severity"]) {
  if (severity === "alert") return { Icon: AlertTriangle, tone: "text-tone-red-fg bg-tone-red-soft" };
  if (severity === "moderate") return { Icon: Package, tone: "text-tone-amber-fg bg-tone-amber-soft" };
  return { Icon: CalendarClock, tone: "text-brand-text bg-brand-soft" };
}

export function NotificationCenter({ notifications }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<ReadonlySet<string>>(new Set());
  const unread = notifications.filter((item) => !seen.has(item.id)).length;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const markAllSeen = () => setSeen(new Set(notifications.map((item) => item.id)));
  const markSeen = (id: string) => setSeen((current) => new Set(current).add(id));

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notificaciones: ${unread} sin ver`}
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={() => setOpen((value) => !value)}
        className="ui-icon-button relative flex size-11 items-center justify-center rounded-full border border-line bg-surface text-ink-muted hover:border-brand hover:text-brand-text"
      >
        <Bell key={unread} className={cn("size-5", unread > 0 && "ui-ring")} aria-hidden />
        {unread > 0 && (
          <span
            key={unread}
            className="ui-pop absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[0.7rem] font-bold text-on-brand"
          >
            {unread > 99 ? "99+" : unread}
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
                <p className="text-xs text-ink-muted">
                  {unread} sin ver · {notifications.length} en total
                </p>
              </div>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllSeen}
                  className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-text hover:bg-brand hover:text-on-brand"
                >
                  <CheckCheck className="size-3.5" aria-hidden /> Marcar todo
                </button>
              )}
            </header>

            {notifications.length === 0 ? (
              <div className="px-5 py-9 text-center">
                <CheckCheck className="ui-pop mx-auto size-8 text-tone-green-fg" aria-hidden />
                <p className="mt-2 font-semibold">Todo está al día</p>
                <p className="mt-1 text-sm text-ink-muted">No hay alertas de stock ni citas próximas.</p>
              </div>
            ) : (
              <ul className="stagger max-h-[min(65vh,460px)] divide-y divide-line overflow-y-auto">
                {notifications.map((item) => {
                  const { Icon, tone } = notificationAppearance(item.severity);
                  const isNew = !seen.has(item.id);

                  return (
                    <li key={item.id}>
                      <Link
                        to={item.href}
                        onClick={() => {
                          markSeen(item.id);
                          setOpen(false);
                        }}
                        className="flex gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
                      >
                        <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl", tone)}>
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cn("block text-sm", isNew ? "font-bold" : "font-medium")}>{item.title}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{item.description}</span>
                        </span>
                        {isNew && <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-brand" />}
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