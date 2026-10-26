import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { AppError, BadRequestError } from "~/core/errors/app-error";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import { createOrderSchema } from "../model/lab.schema";
import { LabRepository } from "../model/lab.repository.server";
import type { AnalisisResult } from "../model/lab.types";

const ESTADOS = ["pendientes", "completados", "cancelados", "todos"] as const;

const blank = (value: FormDataEntryValue | null) => {
    const text = typeof value === "string" ? value.trim() : "";
    return text || undefined;
};

export class AnalisisController {
    loader = async ({ request }: LoaderFunctionArgs) => {
        const { supabase, headers, user } = await requireUser(request);
        const repository = new LabRepository(supabase);
        const clinical = user.role !== "recepcion";
        const requested = new URL(request.url).searchParams.get("estado");
        const estado = ESTADOS.find((e) => e === requested) ?? "pendientes";

        const [orders, patients, analyses] = await Promise.all([
            repository.list(),
            clinical ? repository.getPatients() : Promise.resolve([]),
            clinical ? repository.getAnalyses() : Promise.resolve([]),
        ]);

        return data({ orders, patients, analyses, estado, clinical }, { headers });
    };

    action = async ({ request }: ActionFunctionArgs) => {
        assertSameOrigin(request);
        const { supabase, headers } = await requireUser(request, ["admin", "veterinario"]);
        const form = await request.formData();

        try {
            const parsed = createOrderSchema.safeParse({
                patientId: blank(form.get("patientId")),
                serviceIds: form.getAll("serviceIds"),
                notes: blank(form.get("notes")),
            });
            if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? "Datos no válidos.");

            await new LabRepository(supabase).create(parsed.data);
            const result: AnalisisResult = { ok: true, intent: "create", message: "Orden de análisis creada." };
            return data(result, { headers });
        } catch (error) {
            if (!(error instanceof AppError)) throw error;
            const result: AnalisisResult = { ok: false, intent: "create", message: error.message };
            return data(result, { status: error.status, headers });
        }
    };
}

const controller = new AnalisisController();
export const analisisLoader = controller.loader;
export const analisisAction = controller.action;