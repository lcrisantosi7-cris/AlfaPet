import type { SupabaseServerClient } from "~/core/supabase/client.server";
import type {
  AppointmentSummary,
  DashboardSnapshot,
  PatientSummary,
  Species,
} from "./dashboard.types";

const TZ = "America/Lima";
const SPECIES_LABEL: Record<string, Species> = { perro: "Perro", gato: "Gato", otro: "Perro" };
const isoDay = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
const dayKey = (d: Date) => isoDay.format(d); // "2026-10-22"
const timeFmt = new Intl.DateTimeFormat("es-PE", {
  timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: true,
});

function scheduleLabel(startsAt: string) {
  const date = new Date(startsAt);
  const today = dayKey(new Date());
  const tomorrow = dayKey(new Date(Date.now() + 86_400_000));
  const key = dayKey(date);
  const day =
    key === today ? "Hoy" : key === tomorrow ? "Mañana"
      : new Intl.DateTimeFormat("es-PE", { timeZone: TZ, day: "2-digit", month: "2-digit" }).format(date);
  const time = timeFmt.format(date).replace(/\s/g, " ").replace("a. m.", "a.m.").replace("p. m.", "p.m.");
  return `${day} - ${time}`;
}

interface RawAppointment extends Omit<AppointmentSummary, "scheduleLabel"> {
  startsAt: string;
}
interface RawPatient extends Omit<PatientSummary, "species" | "registeredAt"> {
  species: string;
  createdAt: string;
}
interface RawSnapshot extends Omit<DashboardSnapshot, "upcoming" | "recentPatients"> {
  upcoming: RawAppointment[];
  recentPatients: RawPatient[];
}

/** Una sola llamada al RPC `get_dashboard_snapshot`; las políticas RLS se aplican al usuario. */
export async function getDashboardSnapshot(supabase: SupabaseServerClient): Promise<DashboardSnapshot> {
  const { data, error } = await supabase.rpc("get_dashboard_snapshot");
  if (error) throw new Response("No se pudo cargar el panel", { status: 500 });

  const raw = data as RawSnapshot;
  return {
    stats: raw.stats,
    weekly: raw.weekly,
    careTypes: raw.careTypes,
    upcoming: raw.upcoming.map(({ startsAt, photoUrl, ...rest }) => ({
      ...rest,
      photoUrl: photoUrl ?? undefined,
      scheduleLabel: scheduleLabel(startsAt),
    })),
    recentPatients: raw.recentPatients.map(({ createdAt, species, photoUrl, ...rest }) => ({
      ...rest,
      species: SPECIES_LABEL[species] ?? "Perro",
      registeredAt: dayKey(new Date(createdAt)),
      photoUrl: photoUrl ?? undefined,
    })),
  };
}