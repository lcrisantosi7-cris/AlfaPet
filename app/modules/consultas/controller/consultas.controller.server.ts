import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { AppError } from "~/core/errors/app-error";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import { consultaSchema } from "../model/consulta.schema";
import { ConsultaRepository } from "../model/consulta.repository.server";
import type { ConsultaActionResult } from "../model/consulta.types";

const CLINICAL = ["admin", "veterinario"] as const;

export async function consultasLoader({ request }: LoaderFunctionArgs) {
    const { supabase, headers } = await requireUser(request, CLINICAL);
    const repo = new ConsultaRepository(supabase);
    const [rows, options] = await Promise.all([repo.list(), repo.formOptions()]);
    return data({ rows, ...options }, { headers });
}

export async function consultasAction({ request }: ActionFunctionArgs) {
    assertSameOrigin(request);
    const { supabase, headers, user } = await requireUser(request, CLINICAL);
    const parsed = consultaSchema.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) {
        const r: ConsultaActionResult = { ok: false, message: "Revisa los campos marcados.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
        return data(r, { status: 400, headers });
    }
    try {
        await new ConsultaRepository(supabase).create(parsed.data, user.id);
        const r: ConsultaActionResult = { ok: true, message: "Consulta registrada. El peso actual del paciente se actualizó." };
        return data(r, { headers });
    } catch (error) {
        if (!(error instanceof AppError)) throw error;
        const r: ConsultaActionResult = { ok: false, message: error.message };
        return data(r, { status: error.status, headers });
    }
}