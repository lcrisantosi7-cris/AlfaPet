import { data, type LoaderFunctionArgs } from "react-router";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import { addDays, diffDays, limaToday } from "../model/reporte-dates";
import { ReporteRepository } from "../model/reporte.repository.server";

const validDate = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : "");

export async function reportesLoader({ request }: LoaderFunctionArgs) {
    const { supabase, headers } = await requireUser(request, ["admin"]);
    const url = new URL(request.url);
    const today = limaToday();

    let from = validDate(url.searchParams.get("desde"));
    let to = validDate(url.searchParams.get("hasta"));
    const requested = Number(url.searchParams.get("rango"));
    let preset: number | null = [7, 30, 90, 365].includes(requested) ? requested : null;

    if (from || to) {
        preset = null;
        to = to || today;
        from = from || addDays(to, -29);
    } else {
        preset = preset ?? 30;
        to = today;
        from = addDays(today, -preset + 1);
    }
    if (from > to) [from, to] = [to, from];
    if (diffDays(from, to) > 365) from = addDays(to, -364);

    const report = await new ReporteRepository(supabase).build(from, to, preset);
    return data({ report }, { headers });
}