import { data, type LoaderFunctionArgs } from "react-router";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import { PatientRepository } from "~/modules/pacientes/model/patient.repository.server";
import { SupabaseDashboardRepository } from "../model/supabase-dashboard.repository.server";

export class DashboardController {
  loader = async ({ request }: LoaderFunctionArgs) => {
    const { supabase, headers, user } = await requireUser(request);

    const repository = new SupabaseDashboardRepository(supabase);
    const canRegisterPatients = user.role === "admin" || user.role === "recepcion";

    const [snapshot, patientOptions, vetAgenda] = await Promise.all([
      repository.getSnapshot(),
      canRegisterPatients
        ? new PatientRepository(supabase).getOptions()
        : Promise.resolve(null),
      user.role === "veterinario"
        ? repository.getVetAgenda(user.id)
        : Promise.resolve(null),
    ]);

    const firstName = user.name.split(" ")[0] ?? user.name;
    const todayLabel = new Intl.DateTimeFormat("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "America/Lima",
    }).format(new Date());

    return data({ snapshot, patientOptions, vetAgenda, userRole: user.role, firstName, todayLabel }, { headers });
  };
}

export const dashboardLoader = new DashboardController().loader;