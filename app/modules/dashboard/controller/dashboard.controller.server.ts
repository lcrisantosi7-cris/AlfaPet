import { data, type LoaderFunctionArgs } from "react-router";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import { getDashboardSnapshot } from "../model/dashboard.repository.server";

export async function dashboardLoader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = await requireUser(request);
  return data({ snapshot: await getDashboardSnapshot(supabase) }, { headers });
}