import type { CSSProperties } from "react";
import { NewPatientDialog } from "~/modules/pacientes/view/NewPatientDialog";
import type { PatientOptions } from "~/modules/pacientes/model/patient.types";
import type { AdminOverview } from "../model/admin-overview.types";
import type { DashboardSnapshot } from "../model/dashboard.types";
import { AdminHero } from "./AdminHero";
import { AdminKpiGrid } from "./AdminKpiGrid";
import { AttentionCenter } from "./AttentionCenter";
import { CareTypesCard } from "./CareTypesCard";
import { ChannelBreakdown } from "./ChannelBreakdown";
import { OccupancyCard } from "./OccupancyCard";
import { RecentPatientsCard } from "./RecentPatientsCard";
import { RevenueChart } from "./RevenueChart";
import { TodayAgenda } from "./TodayAgenda";

interface AdminDashboardViewProps {
    overview: AdminOverview;
    snapshot: DashboardSnapshot;
    patientOptions: PatientOptions | null;
    greeting: string;
    firstName: string;
    todayLabel: string;
}

/** Bloque con entrada escalonada: `order` define el retraso. */
const stagger = (order: number) => ({ "--i": order } as CSSProperties);

export function AdminDashboardView({ overview, snapshot, patientOptions, greeting, firstName, todayLabel }: AdminDashboardViewProps) {
    return (
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
            <AdminHero
                greeting={greeting}
                firstName={firstName}
                todayLabel={todayLabel}
                appointments={overview.appointments.total}
                surgeries={overview.surgeries.today}
                alerts={overview.attention.length}
                primaryAction={patientOptions ? <NewPatientDialog options={patientOptions} compact /> : null}
            />

            <AdminKpiGrid overview={overview} />

            <div className="grid gap-5 xl:grid-cols-12">
                <div className="flex min-w-0 flex-col gap-5 xl:col-span-8">
                    <div className="rise-in" style={stagger(7)}><RevenueChart series={overview.revenue.series} /></div>
                    <div className="grid gap-5 lg:grid-cols-2">
                        <div className="rise-in min-w-0" style={stagger(8)}><TodayAgenda items={overview.agenda} /></div>
                        <div className="rise-in min-w-0" style={stagger(9)}><ChannelBreakdown channels={overview.channels} /></div>
                    </div>
                    <div className="rise-in" style={stagger(10)}><RecentPatientsCard patients={snapshot.recentPatients} /></div>
                </div>

                <aside aria-label="Alertas y capacidad" className="flex min-w-0 flex-col gap-5 xl:col-span-4">
                    <div className="rise-in" style={stagger(7)}><AttentionCenter items={overview.attention} /></div>
                    <div className="rise-in" style={stagger(8)}><OccupancyCard active={overview.admissions.active} capacity={overview.admissions.capacity} /></div>
                    <div className="rise-in" style={stagger(9)}><CareTypesCard shares={snapshot.careTypes} /></div>
                </aside>
            </div>
        </div>
    );
}