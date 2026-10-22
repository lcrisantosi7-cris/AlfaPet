import { data, type LoaderFunctionArgs } from "react-router";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import { PatientRepository } from "~/modules/pacientes/model/patient.repository.server";
import { SupabaseDashboardRepository } from "../model/supabase-dashboard.repository.server";

export class DashboardController {
  loader = async ({ request }: LoaderFunctionArgs) => {
    const { supabase, headers, user } = await requireUser(request);

    const [snapshot, patientOptions] = await Promise.all([
      new SupabaseDashboardRepository(supabase).getSnapshot(),
      new PatientRepository(supabase).getOptions(),
    ]);

    const firstName = user.name.split(" ")[0] ?? user.name;
    return data({ snapshot, patientOptions, firstName }, { headers });
  };
}

export const dashboardLoader = new DashboardController().loader;