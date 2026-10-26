import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { AppError, BadRequestError, ConflictError, NotFoundError } from "~/core/errors/app-error";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import type { Role } from "~/modules/auth/model/user.types";
import { dischargeSchema, noteSchema } from "../model/admission.schema";
import { AdmissionRepository } from "../model/admission.repository.server";
import type { InternamientoResult } from "../model/admission.types";

const CLINICAL: readonly Role[] = ["admin", "veterinario"];

const blank = (value: FormDataEntryValue | null) => {
    const text = typeof value === "string" ? value.trim() : "";
    return text || undefined;
};

export class AdmissionDetailController {
    loader = async ({ request, params }: LoaderFunctionArgs) => {
        const id = z.uuid().safeParse(params.id);
        if (!id.success) throw new NotFoundError("Internamiento no encontrado").toResponse();

        const { supabase, headers } = await requireUser(request, CLINICAL);
        const admission = await new AdmissionRepository(supabase).getDetail(id.data);
        if (!admission) throw new NotFoundError("Internamiento no encontrado").toResponse();
        return data({ admission }, { headers });
    };

    action = async ({ request }: ActionFunctionArgs) => {
        assertSameOrigin(request);
        const { supabase, headers } = await requireUser(request, CLINICAL);
        const form = await request.formData();
        const repository = new AdmissionRepository(supabase);
        const intent = form.get("intent") === "discharge" ? "discharge" : "note";

        try {
            if (intent === "note") await this.addNote(repository, form);
            else await this.discharge(repository, form);

            const result: InternamientoResult = {
                ok: true, intent,
                message: intent === "note" ? "Nota de evolución registrada." : "Internamiento cerrado correctamente.",
            };
            return data(result, { headers });
        } catch (error) {
            if (!(error instanceof AppError)) throw error;
            const result: InternamientoResult = { ok: false, intent, message: error.message };
            return data(result, { status: error.status, headers });
        }
    };

    private async addNote(repository: AdmissionRepository, form: FormData) {
        const parsed = noteSchema.safeParse({
            admissionId: blank(form.get("admissionId")),
            note: form.get("note"),
            weightKg: blank(form.get("weightKg")),
            temperatureC: blank(form.get("temperatureC")),
        });
        if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? "Datos no válidos.");
        if ((await repository.getStatus(parsed.data.admissionId)) !== "internado") {
            throw new ConflictError("Este internamiento ya está cerrado: no admite nuevas notas.");
        }
        await repository.addNote(parsed.data);
    }

    private async discharge(repository: AdmissionRepository, form: FormData) {
        const parsed = dischargeSchema.safeParse({
            admissionId: blank(form.get("admissionId")),
            outcome: blank(form.get("outcome")),
            notes: blank(form.get("notes")),
        });
        if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? "Datos no válidos.");
        await repository.discharge(parsed.data);
    }
}

const controller = new AdmissionDetailController();
export const admissionDetailLoader = controller.loader;
export const admissionDetailAction = controller.action;