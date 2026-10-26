import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { AppError, BadRequestError } from "~/core/errors/app-error";
import { LimaTime } from "~/core/lib/lima-time";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import type { Role } from "~/modules/auth/model/user.types";
import { scheduleSchema } from "../model/surgery.schema";
import { SurgeryRepository } from "../model/surgery.repository.server";
import type { CirugiasResult } from "../model/surgery.types";

const CLINICAL: readonly Role[] = ["admin", "veterinario"];
const ESTADOS = ["programada", "en_curso", "completada", "cancelada", "todas"] as const;

const blank = (value: FormDataEntryValue | null) => {
    const text = typeof value === "string" ? value.trim() : "";
    return text || undefined;
};

/** "2026-10-24T14:05" en hora de Lima, para el atributo `min` del selector de fecha. */
function nowInLima(now = new Date()) {
    const time = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Lima", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
    return `${LimaTime.dayKey(now)}T${time}`;
}

export class CirugiasController {
    loader = async ({ request }: LoaderFunctionArgs) => {
        const { supabase, headers, user } = await requireUser(request, CLINICAL);
        const repository = new SurgeryRepository(supabase);
        const requested = new URL(request.url).searchParams.get("estado");
        const estado = ESTADOS.find((e) => e === requested) ?? "programada";

        const [surgeries, patients, procedures, surgeons] = await Promise.all([
            repository.list(),
            repository.getPatients(),
            repository.getProcedures(),
            user.role === "admin" ? repository.getSurgeons() : Promise.resolve([]),
        ]);

        return data(
            { surgeries, patients, procedures, surgeons, estado, isAdmin: user.role === "admin", nowLocal: nowInLima() },
            { headers },
        );
    };

    action = async ({ request }: ActionFunctionArgs) => {
        assertSameOrigin(request);
        const { supabase, headers, user } = await requireUser(request, CLINICAL);
        const form = await request.formData();

        try {
            const parsed = scheduleSchema.safeParse({
                patientId: blank(form.get("patientId")),
                serviceId: form.get("serviceId"),
                surgeonId: user.role === "admin" ? blank(form.get("surgeonId")) : undefined,
                scheduledAt: blank(form.get("scheduledAt")),
                price: form.get("price"),
                preOpNotes: blank(form.get("preOpNotes")),
            });
            if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? "Datos no válidos.");

            const surgeonId = user.role === "veterinario" ? user.id : parsed.data.surgeonId;
            if (!surgeonId) throw new BadRequestError("Elige el cirujano responsable.");

            await new SurgeryRepository(supabase).schedule(parsed.data, surgeonId);
            const result: CirugiasResult = { ok: true, intent: "schedule", message: "Cirugía programada correctamente." };
            return data(result, { headers });
        } catch (error) {
            if (!(error instanceof AppError)) throw error;
            const result: CirugiasResult = { ok: false, intent: "schedule", message: error.message };
            return data(result, { status: error.status, headers });
        }
    };
}

const controller = new CirugiasController();
export const cirugiasLoader = controller.loader;
export const cirugiasAction = controller.action;