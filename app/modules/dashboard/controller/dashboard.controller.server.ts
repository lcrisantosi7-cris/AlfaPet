import { data, type LoaderFunctionArgs } from "react-router";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import { PatientRepository } from "~/modules/pacientes/model/patient.repository.server";
import { SupabaseDashboardRepository } from "../model/supabase-dashboard.repository.server";
import { AdminOverviewRepository } from "../model/admin-overview.repository.server";
import { SupabaseVetAgendaRepository } from "../model/vet-agenda.repository.server";

export class DashboardController {
  loader = async ({ request }: LoaderFunctionArgs) => {
    const { supabase, headers, user } = await requireUser(request);

    const repository = new SupabaseDashboardRepository(supabase);
    const canRegisterPatients = user.role === "admin" || user.role === "recepcion";

    const [snapshot, patientOptions, vetAgenda, overview] = await Promise.all([
      repository.getSnapshot(),
      canRegisterPatients
        ? new PatientRepository(supabase).getOptions()
        : Promise.resolve(null),
      user.role === "veterinario"
        ? new SupabaseVetAgendaRepository(supabase).getVetAgenda(user.id)
        : Promise.resolve(null),
      user.role === "admin"
        ? new AdminOverviewRepository(supabase).get()
        : Promise.resolve(null),
    ]);

    const firstName = user.name.split(" ")[0] ?? user.name;
    const hour = Number(
      new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: "America/Lima" }).format(new Date()),
    );
    const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
    const todayLabel = new Intl.DateTimeFormat("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "America/Lima",
    }).format(new Date());

    return data({ snapshot, patientOptions, vetAgenda, overview, greeting, userRole: user.role, firstName, todayLabel }, { headers });
  };
}

export const dashboardLoader = new DashboardController().loader;