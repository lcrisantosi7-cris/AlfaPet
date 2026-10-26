import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { AppError, BadRequestError, ConflictError, NotFoundError } from "~/core/errors/app-error";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import type { Role } from "~/modules/auth/model/user.types";
import { orderIdSchema, resultSchema } from "../model/lab.schema";
import { LabRepository } from "../model/lab.repository.server";
import type { AnalisisResult } from "../model/lab.types";

const CLINICAL: readonly Role[] = ["admin", "veterinario"];

const blank = (value: FormDataEntryValue | null) => {
    const text = typeof value === "string" ? value.trim() : "";
    return text || undefined;
};

const MESSAGES = {
    sample: "Toma de muestra registrada.",
    process: "Orden en proceso.",
    result: "Resultado guardado.",
    complete: "Orden completada.",
    cancel: "Orden cancelada.",
} as const;

type Intent = keyof typeof MESSAGES;

export class LabOrderDetailController {
    loader = async ({ request, params }: LoaderFunctionArgs) => {
        const id = z.uuid().safeParse(params.id);
        if (!id.success) throw new NotFoundError("Orden no encontrada").toResponse();

        const { supabase, headers } = await requireUser(request, CLINICAL);
        const order = await new LabRepository(supabase).getDetail(id.data);
        if (!order) throw new NotFoundError("Orden no encontrada").toResponse();
        return data({ order }, { headers });
    };

    action = async ({ request }: ActionFunctionArgs) => {
        assertSameOrigin(request);
        const { supabase, headers, user } = await requireUser(request, CLINICAL);
        const form = await request.formData();
        const repository = new LabRepository(supabase);
        const intent = String(form.get("intent")) as Intent;

        try {
            if (!(intent in MESSAGES)) throw new BadRequestError("Operación no válida.");
            await this.run(intent, repository, form, user.id);
            const result: AnalisisResult = { ok: true, intent, message: MESSAGES[intent] };
            return data(result, { headers });
        } catch (error) {
            if (!(error instanceof AppError)) throw error;
            const result: AnalisisResult = { ok: false, intent, message: error.message };
            return data(result, { status: error.status, headers });
        }
    };

    private async run(intent: Intent, repository: LabRepository, form: FormData, userId: string) {
        if (intent === "result") return this.saveResult(repository, form, userId);

        const parsed = orderIdSchema.safeParse({ orderId: blank(form.get("orderId")) });
        if (!parsed.success) throw new BadRequestError("Orden no válida.");
        const { orderId } = parsed.data;

        switch (intent) {
            case "sample":
                return repository.transition(orderId, ["solicitado"], "muestra_tomada", "La muestra ya fue registrada o la orden se cerró.");
            case "process":
                return repository.transition(orderId, ["muestra_tomada"], "en_proceso", "Primero registra la toma de muestra.");
            case "complete":
                if ((await repository.countPendingResults(orderId)) > 0) {
                    throw new BadRequestError("Faltan resultados: ingresa todos antes de completar la orden.");
                }
                return repository.transition(orderId, ["en_proceso"], "completado", "La orden debe estar en proceso para completarse.");
            default:
                return repository.cancel(orderId);
        }
    }

    private async saveResult(repository: LabRepository, form: FormData, userId: string) {
        const parsed = resultSchema.safeParse({
            orderId: blank(form.get("orderId")),
            itemId: blank(form.get("itemId")),
            value: form.get("value"),
            unit: blank(form.get("unit")),
            range: blank(form.get("range")),
            notes: blank(form.get("notes")),
        });
        if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? "Datos no válidos.");

        const status = await repository.getStatus(parsed.data.orderId);
        if (status !== "muestra_tomada" && status !== "en_proceso") {
            throw new ConflictError("Solo se registran resultados después de tomar la muestra y antes de cerrar la orden.");
        }
        await repository.saveResult(parsed.data, userId);
    }
}

const controller = new LabOrderDetailController();
export const labOrderDetailLoader = controller.loader;
export const labOrderDetailAction = controller.action;