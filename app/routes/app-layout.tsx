import { data, Outlet, type LoaderFunctionArgs } from "react-router";
import { navItemsForRole } from "~/core/config/navigation";
import { AppShell } from "~/core/layout/AppShell";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import type { Route } from "./+types/app-layout";

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  href: string;
  severity: "alert" | "moderate" | "info";
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { user, supabase, headers } = await requireUser(request);
  const notifications: AppNotification[] = [];

  // Alertas operativas en vivo: se calculan con las existencias actuales, no con un contador fijo.
  if (user.role === "admin" || user.role === "recepcion") {
    const { data: products } = await supabase
      .from("products")
      .select("id,name,stock")
      .lte("stock", 20)
      .order("stock", { ascending: true })
      .limit(20);

    for (const product of products ?? []) {
      const stock = Number(product.stock ?? 0);
      notifications.push({
        id: `stock-${product.id}`,
        title: stock <= 10 ? "Alerta de bajo stock" : "Stock moderado",
        description: `${product.name}: ${stock} unidades disponibles.`,
        href: "/productos",
        severity: stock <= 10 ? "alert" : "moderate",
      });
    }
  }

  // Próximas citas: ayuda a recepción y al veterinario a detectar atenciones cercanas.
  const now = new Date();
  const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id,starts_at,status,patient:patients(name),vet_id")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", nextDay.toISOString())
    .order("starts_at", { ascending: true })
    .limit(20);

  for (const appointment of appointments ?? []) {
    if (["cancelada", "cancelado", "completada", "completado"].includes(String(appointment.status).toLowerCase())) continue;
    const patient = Array.isArray(appointment.patient) ? appointment.patient[0] : appointment.patient;
    notifications.push({
      id: `appointment-${appointment.id}`,
      title: "Cita en las próximas 24 horas",
      description: `${patient?.name ?? "Paciente"} · ${new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(appointment.starts_at))}`,
      href: "/citas",
      severity: "info",
    });
  }

  return data(
    {
      user,
      navItems: navItemsForRole(user.role),
      notifications,
      unreadNotifications: notifications.length,
    },
    { headers },
  );
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const { user, navItems, unreadNotifications, notifications } = loaderData;

  return (
    <AppShell user={user} navItems={navItems} unreadNotifications={unreadNotifications} notifications={notifications}>
      <Outlet />
    </AppShell>
  );
}
