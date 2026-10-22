import { data, Outlet, type LoaderFunctionArgs } from "react-router";
import { navItemsForRole } from "~/core/config/navigation";
import { AppShell } from "~/core/layout/AppShell";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import type { Route } from "./+types/app-layout";

export async function loader({ request }: LoaderFunctionArgs) {
  const { user, headers } = await requireUser(request);
  return data(
    {
      user,
      navItems: navItemsForRole(user.role),
      unreadNotifications: 0, // TODO: módulo de notificaciones
    },
    { headers },
  );
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const { user, navItems, unreadNotifications } = loaderData;

  return (
    <AppShell user={user} navItems={navItems} unreadNotifications={unreadNotifications}>
      <Outlet />
    </AppShell>
  );
}