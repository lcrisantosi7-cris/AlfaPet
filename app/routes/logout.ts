import { redirect } from "react-router";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { createSupabaseServerClient } from "~/core/supabase/client.server";
import { AuthService } from "~/modules/auth/model/auth.service.server";
import type { Route } from "./+types/logout";

export const loader = () => redirect("/");

export async function action({ request }: Route.ActionArgs) {
    assertSameOrigin(request);
    const { supabase, headers } = createSupabaseServerClient(request);
    await new AuthService(supabase).signOut();
    throw redirect("/login", { headers });
}