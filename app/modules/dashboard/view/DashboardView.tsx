import type { DashboardSnapshot } from "../model/dashboard.types";
import { CareTypesCard } from "./CareTypesCard";
import { HealthPromoCard } from "./HealthPromoCard";
import { RecentPatientsCard } from "./RecentPatientsCard";
import { StatsGrid } from "./StatsGrid";
import { UpcomingAppointmentsCard } from "./UpcomingAppointmentsCard";
import { ValuesCard } from "./ValuesCard";
import { WeeklyAppointmentsCard } from "./WeeklyAppointmentsCard";
import { WelcomeBanner } from "./WelcomeBanner";

export function DashboardView({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <WelcomeBanner />
        <StatsGrid stats={snapshot.stats} />
        <div className="grid gap-6 lg:grid-cols-2">
          <WeeklyAppointmentsCard data={snapshot.weekly} />
          <CareTypesCard shares={snapshot.careTypes} />
        </div>
        <RecentPatientsCard patients={snapshot.recentPatients} />
      </div>

      <aside aria-label="Resumen lateral" className="flex flex-col gap-6">
        <UpcomingAppointmentsCard items={snapshot.upcoming} />
        <HealthPromoCard />
        <ValuesCard />
      </aside>
    </div>
  );
}
