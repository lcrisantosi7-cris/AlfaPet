import { CalendarDays } from "lucide-react";
import { ActionLink } from "~/core/ui/ActionLink";
import { Avatar } from "~/core/ui/Avatar";
import { Badge } from "~/core/ui/Badge";
import { SectionCard } from "~/core/ui/SectionCard";
import type { AppointmentSummary } from "../model/dashboard.types";

const STATUS_LABEL = { confirmada: "Confirmada", pendiente: "Pendiente" } as const;
const STATUS_VARIANT = { confirmada: "success", pendiente: "info" } as const;

export function UpcomingAppointmentsCard({ items }: { items: readonly AppointmentSummary[] }) {
  return (
    <SectionCard
      title="Próximas citas"
      icon={CalendarDays}
      action={<ActionLink to="/citas">Ver todas</ActionLink>}
      bodyClassName="pt-2"
    >
      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-3">
            <Avatar name={item.petName} src={item.photoUrl} shape="rounded" size="lg" />
            <div className="min-w-0 flex-1 leading-snug">
              <p className="font-bold">{item.petName}</p>
              <p className="text-xs text-ink-muted">{item.reason}</p>
              <p className="text-sm">{item.scheduleLabel}</p>
            </div>
            <Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
