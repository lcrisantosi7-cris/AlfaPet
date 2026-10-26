import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { AppError } from "~/core/errors/app-error";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import { vaccinationCreateSchema, vaccinationUpdateSchema } from "../model/vacuna.schema";
import { VacunaRepository } from "../model/vacuna.repository.server";

const CLINICAL = ["admin", "veterinario"] as const;

export async function vacunasLoader({ request }: LoaderFunctionArgs) {
    const { supabase, headers } = await requireUser(request, CLINICAL);
    const repo = new VacunaRepository(supabase);
    const [rows, options] = await Promise.all([repo.list(), repo.options()]);
    return data({ rows, ...options }, { headers });
}

export async function vacunasAction({ request }: ActionFunctionArgs) {
    assertSameOrigin(request);
    const { supabase, headers, user } = await requireUser(request, CLINICAL);
    const raw = Object.fromEntries(await request.formData());
    const intent = String(raw.intent ?? "");
    const repo = new VacunaRepository(supabase);
    const fail = (message: string, status = 400, extra: object = {}) => data({ ok: false, intent, message, ...extra }, { status, headers });
    const invalid = (e: z.ZodError) => fail("Revisa los campos marcados.", 400, { fieldErrors: z.flattenError(e).fieldErrors });

    try {
        if (intent === "create") {
            const p = vaccinationCreateSchema.safeParse(raw);
            if (!p.success) return invalid(p.error);
            await repo.create(p.data, user.id);
            return data({ ok: true, intent, message: "Vacuna registrada correctamente." }, { headers });
        }
        const id = z.uuid().safeParse(raw.recordId);
        if (!id.success) return fail("Registro no válido.");
        if (intent === "update") {
            const p = vaccinationUpdateSchema.safeParse(raw);
            if (!p.success) return invalid(p.error);
            await repo.update(id.data, p.data, user.id);
            return data({ ok: true, intent, message: "Registro actualizado." }, { headers });
        }
        if (intent === "apply") {
            await repo.apply(id.data, user.id);
            return data({ ok: true, intent, message: "Vacuna aplicada. Próxima dosis calculada." }, { headers });
        }
        return fail("Operación no válida.");
    } catch (error) {
        if (!(error instanceof AppError)) throw error;
        return fail(error.message, error.status);
    }
}