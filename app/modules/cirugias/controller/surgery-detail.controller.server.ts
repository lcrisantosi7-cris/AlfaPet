import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { AppError, BadRequestError, NotFoundError } from "~/core/errors/app-error";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import type { Role } from "~/modules/auth/model/user.types";
import { checklistSchema, notesSchema, transitionSchema } from "../model/surgery.schema";
import { SurgeryRepository } from "../model/surgery.repository.server";
import type { CirugiasResult } from "../model/surgery.types";

const CLINICAL: readonly Role[] = ["admin", "veterinario"];

const blank = (value: FormDataEntryValue | null) => {
    const text = typeof value === "string" ? value.trim() : "";
    return text || undefined;
};

const MESSAGES = {
    checklist: "Lista previa actualizada.",
    notes: "Notas guardadas.",
    start: "Cirugía iniciada.",
    complete: "Cirugía completada.",
    cancel: "Cirugía cancelada.",
} as const;

type Intent = keyof typeof MESSAGES;

export class SurgeryDetailController {
    loader = async ({ request, params }: LoaderFunctionArgs) => {
        const id = z.uuid().safeParse(params.id);
        if (!id.success) throw new NotFoundError("Cirugía no encontrada").toResponse();

        const { supabase, headers } = await requireUser(request, CLINICAL);
        const surgery = await new SurgeryRepository(supabase).getDetail(id.data);
        if (!surgery) throw new NotFoundError("Cirugía no encontrada").toResponse();
        return data({ surgery }, { headers });
    };

    action = async ({ request }: ActionFunctionArgs) => {
        assertSameOrigin(request);
        const { supabase, headers } = await requireUser(request, CLINICAL);
        const form = await request.formData();
        const repository = new SurgeryRepository(supabase);
        const intent = String(form.get("intent")) as Intent;

        try {
            if (!(intent in MESSAGES)) throw new BadRequestError("Operación no válida.");
            await this.run(intent, repository, form);
            const result: CirugiasResult = { ok: true, intent, message: MESSAGES[intent] };
            return data(result, { headers });
        } catch (error) {
            if (!(error instanceof AppError)) throw error;
            const result: CirugiasResult = { ok: false, intent, message: error.message };
            return data(result, { status: error.status, headers });
        }
    };

    private async run(intent: Intent, repository: SurgeryRepository, form: FormData) {
        const surgeryId = blank(form.get("surgeryId"));

        if (intent === "checklist") {
            const parsed = checklistSchema.safeParse({
                surgeryId, consentSigned: form.get("consentSigned") === "on", fastingConfirmed: form.get("fastingConfirmed") === "on",
            });
            if (!parsed.success) throw new BadRequestError("Datos no válidos.");
            return repository.updateChecklist(parsed.data);
        }

        if (intent === "notes") {
            const parsed = notesSchema.safeParse({
                surgeryId,
                preOpNotes: blank(form.get("preOpNotes")),
                anesthesiaNotes: blank(form.get("anesthesiaNotes")),
                procedureNotes: blank(form.get("procedureNotes")),
                postOpInstructions: blank(form.get("postOpInstructions")),
            });
            if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? "Datos no válidos.");
            return repository.saveNotes(parsed.data);
        }

        const parsed = transitionSchema.safeParse({ surgeryId });
        if (!parsed.success) throw new BadRequestError("Cirugía no válida.");
        if (intent === "start") return repository.start(parsed.data.surgeryId);
        if (intent === "complete") return repository.complete(parsed.data.surgeryId);
        return repository.cancel(parsed.data.surgeryId);
    }
}

const controller = new SurgeryDetailController();
export const surgeryDetailLoader = controller.loader;
export const surgeryDetailAction = controller.action;