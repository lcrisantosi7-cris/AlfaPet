import { data, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { AppError } from "~/core/errors/app-error";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import { newPatientSchema } from "../model/patient.schema";
import { PatientRepository } from "../model/patient.repository.server";
import type { CreatePatientResult } from "../model/patient.types";

export class PatientController {
    create = async ({ request }: ActionFunctionArgs) => {
        assertSameOrigin(request);
        // El veterinario solo consulta fichas; el alta corresponde a administración y recepción.
        const { supabase, headers } = await requireUser(request, ["admin", "recepcion"]);

        const form = Object.fromEntries(await request.formData());
        const parsed = newPatientSchema.safeParse(form);
        if (!parsed.success) {
            const result: CreatePatientResult = {
                ok: false,
                fieldErrors: z.flattenError(parsed.error).fieldErrors,
            };
            return data(result, { status: 400, headers });
        }

        try {
            const id = await new PatientRepository(supabase).create(parsed.data);
            const result: CreatePatientResult = { ok: true, id };
            return data(result, { headers });
        } catch (error) {
            if (!(error instanceof AppError)) throw error;
            const result: CreatePatientResult = { ok: false, formError: error.message };
            return data(result, { status: error.status, headers });
        }
    };
}

export const createPatientAction = new PatientController().create;
