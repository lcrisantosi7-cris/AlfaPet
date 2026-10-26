import { data, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { NotFoundError } from "~/core/errors/app-error";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import { HistorialRepository } from "../model/historial.repository.server";

const CLINICAL = ["admin", "veterinario"] as const;

export async function historialLoader({ request }: LoaderFunctionArgs) {
    const { supabase, headers } = await requireUser(request, CLINICAL);
    return data({ rows: await new HistorialRepository(supabase).listPatients() }, { headers });
}

export async function historialDetailLoader({ request, params }: LoaderFunctionArgs) {
    const id = z.uuid().safeParse(params.id);
    if (!id.success) throw new NotFoundError("Paciente no encontrado").toResponse();
    const { supabase, headers } = await requireUser(request, CLINICAL);
    const repo = new HistorialRepository(supabase);
    const [patient, timeline] = await Promise.all([repo.getPatient(id.data), repo.timeline(id.data)]);
    if (!patient) throw new NotFoundError("Paciente no encontrado").toResponse();
    return data({ patient, timeline }, { headers });
}