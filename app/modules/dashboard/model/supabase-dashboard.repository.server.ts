import { capitalize } from "~/core/lib/format";
import { LimaTime } from "~/core/lib/lima-time";
import type { SupabaseServerClient } from "~/core/supabase/client.server";
import type {
    AppointmentSummary,
    DashboardRepository,
    DashboardSnapshot,
    PatientSummary,
} from "./dashboard.types";

interface RawAppointment extends Omit<AppointmentSummary, "scheduleLabel" | "photoUrl"> {
    startsAt: string;
    photoUrl: string | null;
}

interface RawPatient extends Omit<PatientSummary, "species" | "registeredAt" | "photoUrl"> {
    species: string;
    createdAt: string;
    photoUrl: string | null;
}

interface RawSnapshot extends Omit<DashboardSnapshot, "upcoming" | "recentPatients"> {
    upcoming: RawAppointment[];
    recentPatients: RawPatient[];
}

/** Una sola llamada al RPC `get_dashboard_snapshot`; las políticas RLS se aplican al usuario. */
export class SupabaseDashboardRepository implements DashboardRepository {
    constructor(private readonly supabase: SupabaseServerClient) { }

    async getSnapshot(): Promise<DashboardSnapshot> {
        const { data, error } = await this.supabase.rpc("get_dashboard_snapshot");
        if (error) throw new Response("No se pudo cargar el panel", { status: 500 });

        const raw = data as RawSnapshot;
        return {
            stats: raw.stats,
            weekly: raw.weekly,
            careTypes: raw.careTypes,
            upcoming: raw.upcoming.map(SupabaseDashboardRepository.toAppointment),
            recentPatients: raw.recentPatients.map(SupabaseDashboardRepository.toPatient),
        };
    }

    private static toAppointment({ startsAt, photoUrl, ...rest }: RawAppointment): AppointmentSummary {
        return {
            ...rest,
            photoUrl: photoUrl ?? undefined,
            scheduleLabel: LimaTime.scheduleLabel(startsAt),
        };
    }

    private static toPatient({ createdAt, species, photoUrl, ...rest }: RawPatient): PatientSummary {
        return {
            ...rest,
            species: capitalize(species),
            registeredAt: LimaTime.dayKey(new Date(createdAt)),
            photoUrl: photoUrl ?? undefined,
        };
    }
}