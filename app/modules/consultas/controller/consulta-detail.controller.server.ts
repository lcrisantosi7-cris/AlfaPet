import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { AppError, NotFoundError } from "~/core/errors/app-error";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import { consultaUpdateSchema } from "../model/consulta.schema";
import { ConsultaRepository } from "../model/consulta.repository.server";
import type { ConsultaActionResult } from "../model/consulta.types";

const CLINICAL = ["admin", "veterinario"] as const;

export async function consultaDetailLoader({ request, params }: LoaderFunctionArgs) {
    const id = z.uuid().safeParse(params.id);
    if (!id.success) throw new NotFoundError("Consulta no encontrada").toResponse();
    const { supabase, headers } = await requireUser(request, CLINICAL);
    const consulta = await new ConsultaRepository(supabase).getDetail(id.data);
    if (!consulta) throw new NotFoundError("Consulta no encontrada").toResponse();
    return data({ consulta }, { headers });
}

export async function consultaDetailAction({ request, params }: ActionFunctionArgs) {
    assertSameOrigin(request);
    const id = z.uuid().safeParse(params.id);
    const { supabase, headers } = await requireUser(request, CLINICAL);
    if (!id.success) return data({ ok: false, message: "Consulta no válida." } satisfies ConsultaActionResult, { status: 400, headers });

    const parsed = consultaUpdateSchema.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) {
        const r: ConsultaActionResult = { ok: false, intent: "update", message: "Revisa los campos marcados.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
        return data(r, { status: 400, headers });
    }
    try {
        await new ConsultaRepository(supabase).update(id.data, parsed.data);
        return data({ ok: true, intent: "update", message: "Consulta actualizada." } satisfies ConsultaActionResult, { headers });
    } catch (error) {
        if (!(error instanceof AppError)) throw error;
        return data({ ok: false, intent: "update", message: error.message } satisfies ConsultaActionResult, { status: error.status, headers });
    }
}