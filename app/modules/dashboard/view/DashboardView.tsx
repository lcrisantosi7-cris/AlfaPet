import { NewPatientDialog } from "~/modules/pacientes/view/NewPatientDialog";
import type { PatientOptions } from "~/modules/pacientes/model/patient.types";
import type { DashboardSnapshot } from "../model/dashboard.types";
import { CareTypesCard } from "./CareTypesCard";
import { RecentPatientsCard } from "./RecentPatientsCard";
import { StatsGrid } from "./StatsGrid";
import { UpcomingAppointmentsCard } from "./UpcomingAppointmentsCard";
import { WeeklyAppointmentsCard } from "./WeeklyAppointmentsCard";
import { WelcomeBanner } from "./WelcomeBanner";

interface DashboardViewProps {
  snapshot: DashboardSnapshot;
  patientOptions: PatientOptions;
  firstName: string;
}

export function DashboardView({ snapshot, patientOptions, firstName }: DashboardViewProps) {
  const appointmentsToday = snapshot.stats.find((s) => s.kind === "appointmentsToday")?.value ?? 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <WelcomeBanner
          firstName={firstName}
          appointmentsToday={appointmentsToday}
          action={<NewPatientDialog options={patientOptions} />}
        />
        <StatsGrid stats={snapshot.stats} />
        <div className="grid gap-6 lg:grid-cols-2">
          <WeeklyAppointmentsCard data={snapshot.weekly} />
          <CareTypesCard shares={snapshot.careTypes} />
        </div>
        <RecentPatientsCard patients={snapshot.recentPatients} />
      </div>

      <aside aria-label="Resumen lateral" className="flex flex-col gap-6">
        <UpcomingAppointmentsCard items={snapshot.upcoming} />
      </aside>
    </div>
  );
}