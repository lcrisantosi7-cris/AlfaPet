import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { AppError, BadRequestError } from "~/core/errors/app-error";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import { admitSchema } from "../model/admission.schema";
import { AdmissionRepository } from "../model/admission.repository.server";
import type { InternamientoResult } from "../model/admission.types";

const blank = (value: FormDataEntryValue | null) => {
    const text = typeof value === "string" ? value.trim() : "";
    return text || undefined;
};

export class InternamientoController {
    loader = async ({ request }: LoaderFunctionArgs) => {
        const { supabase, headers, user } = await requireUser(request);
        const repository = new AdmissionRepository(supabase);
        const clinical = user.role !== "recepcion";

        const [kennels, patients, vets, defaultRate] = await Promise.all([
            repository.getBoard(clinical),
            clinical ? repository.getAdmissiblePatients() : Promise.resolve([]),
            user.role === "admin" ? repository.getVets() : Promise.resolve([]),
            clinical ? repository.getDefaultRate() : Promise.resolve(0),
        ]);

        return data({ kennels, patients, vets, defaultRate, clinical, isAdmin: user.role === "admin" }, { headers });
    };

    action = async ({ request }: ActionFunctionArgs) => {
        assertSameOrigin(request);
        const { supabase, headers, user } = await requireUser(request, ["admin", "veterinario"]);
        const form = await request.formData();

        try {
            const parsed = admitSchema.safeParse({
                kennelId: form.get("kennelId"),
                patientId: blank(form.get("patientId")),
                vetId: user.role === "admin" ? blank(form.get("vetId")) : undefined,
                reason: form.get("reason"),
                diagnosis: blank(form.get("diagnosis")),
                dailyRate: form.get("dailyRate"),
            });
            if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? "Datos no válidos.");

            const vetId = user.role === "veterinario" ? user.id : parsed.data.vetId;
            if (!vetId) throw new BadRequestError("Elige el veterinario responsable.");

            await new AdmissionRepository(supabase).admit(parsed.data, vetId);
            const result: InternamientoResult = { ok: true, intent: "admit", message: "Paciente internado correctamente." };
            return data(result, { headers });
        } catch (error) {
            if (!(error instanceof AppError)) throw error;
            const result: InternamientoResult = { ok: false, intent: "admit", message: error.message };
            return data(result, { status: error.status, headers });
        }
    };
}

const controller = new InternamientoController();
export const internamientoLoader = controller.loader;
export const internamientoAction = controller.action;