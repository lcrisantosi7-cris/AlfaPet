import { NewPatientDialog } from "~/modules/pacientes/view/NewPatientDialog";
import type { PatientOptions } from "~/modules/pacientes/model/patient.types";
import type { Role } from "~/modules/auth/model/user.types";
import type { DashboardSnapshot, VetAgenda } from "../model/dashboard.types";
import { CareTypesCard } from "./CareTypesCard";
import { RecentPatientsCard } from "./RecentPatientsCard";
import { StatsGrid } from "./StatsGrid";
import { UpcomingAppointmentsCard } from "./UpcomingAppointmentsCard";
import { WeeklyAppointmentsCard } from "./WeeklyAppointmentsCard";
import { WelcomeBanner } from "./WelcomeBanner";
import { VeterinarianDashboardView } from "./VeterinarianDashboardView";

interface DashboardViewProps {
  snapshot: DashboardSnapshot;
  patientOptions: PatientOptions | null;
  vetAgenda: VetAgenda | null;
  userRole: Role;
  firstName: string;
}

export function DashboardView({
  snapshot,
  patientOptions,
  vetAgenda,
  userRole,
  firstName,
}: DashboardViewProps) {
  const appointmentsToday = snapshot.stats.find((stat) => stat.kind === "appointmentsToday")?.value ?? 0;

  if (userRole === "veterinario") {
    return (
      <VeterinarianDashboardView
        firstName={firstName}
        snapshot={snapshot}
        agenda={vetAgenda ?? { assigned: [], unassigned: [] }}
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <WelcomeBanner
          firstName={firstName}
          appointmentsToday={appointmentsToday}
          action={patientOptions ? <NewPatientDialog options={patientOptions} /> : null}
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