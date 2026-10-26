import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { AppError, BadRequestError, ForbiddenError } from "~/core/errors/app-error";
import { LimaTime } from "~/core/lib/lima-time";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import type { Role } from "~/modules/auth/model/user.types";
import { checkoutSchema, voidSchema } from "../model/sale.schema";
import { SaleRepository } from "../model/sale.repository.server";
import { formatMoney } from "~/core/lib/format";
import type { PosCatalog, SaleSummary, VentasActionResult } from "../model/sale.types";

const ALLOWED_ROLES: readonly Role[] = ["admin", "recepcion"];

/** Texto del formulario → valor limpio, o undefined si está vacío. */
const blank = (value: FormDataEntryValue | null) => {
    const text = typeof value === "string" ? value.trim() : "";
    return text || undefined;
};

function parseItems(raw: FormDataEntryValue | null): unknown {
    try {
        return JSON.parse(typeof raw === "string" ? raw : "[]");
    } catch {
        throw new BadRequestError("El carrito no es válido. Actualiza la página e intenta de nuevo.");
    }
}

export class VentasController {
    loader = async ({ request }: LoaderFunctionArgs) => {
        const { supabase, headers, user } = await requireUser(request, ALLOWED_ROLES);
        const repository = new SaleRepository(supabase);
        const view: "caja" | "historial" =
            new URL(request.url).searchParams.get("vista") === "historial" ? "historial" : "caja";

        let catalog: PosCatalog | null = null;
        let history: SaleSummary[] | null = null;
        if (view === "caja") catalog = await repository.getPosCatalog();
        else history = await repository.getHistory();

        return data(
            { view, catalog, history, today: LimaTime.dayKey(new Date()), isAdmin: user.role === "admin" },
            { headers },
        );
    };

    action = async ({ request }: ActionFunctionArgs) => {
        assertSameOrigin(request);
        const { supabase, headers, user } = await requireUser(request, ALLOWED_ROLES);
        const form = await request.formData();
        const repository = new SaleRepository(supabase);

        try {
            switch (form.get("intent")) {
                case "checkout":
                    return data(await this.checkout(repository, form), { headers });
                case "void":
                    return data(await this.voidSale(repository, form, user.role), { headers });
                default:
                    throw new BadRequestError("Operación no válida.");
            }
        } catch (error) {
            if (!(error instanceof AppError)) throw error;
            const result: VentasActionResult = { ok: false, message: error.message };
            return data(result, { status: error.status, headers });
        }
    };

    private async checkout(repository: SaleRepository, form: FormData): Promise<VentasActionResult> {
        const parsed = checkoutSchema.safeParse({
            paymentMethod: blank(form.get("paymentMethod")),
            ownerId: blank(form.get("ownerId")),
            prescriptionId: blank(form.get("prescriptionId")),
            notes: blank(form.get("notes")),
            items: parseItems(form.get("items")),
        });
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            throw new BadRequestError(issue?.path[0] === "items" ? "Revisa los ítems de la venta." : (issue?.message ?? "Datos no válidos."));
        }

        const input = parsed.data;
        const prescription = input.prescriptionId ? await repository.findPrescriptionContext(input.prescriptionId) : null;
        if (input.prescriptionId && !prescription) throw new BadRequestError("No se encontró la receta seleccionada.");

        const channel = await repository.resolveChannel(input.items);
        const sale = await repository.register(input, channel, {
            ownerId: prescription?.ownerId ?? input.ownerId,
            patientId: prescription?.patientId,
        });

        return {
            ok: true,
            saleNumber: sale.number,
            message: `Venta #${sale.number} registrada por ${formatMoney(sale.total)}.`,
        };
    }

    private async voidSale(repository: SaleRepository, form: FormData, role: Role): Promise<VentasActionResult> {
        if (role !== "admin") throw new ForbiddenError("Solo un administrador puede anular ventas.");

        const parsed = voidSchema.safeParse({ saleId: blank(form.get("saleId")), reason: form.get("reason") });
        if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? "Datos no válidos.");

        await repository.void(parsed.data.saleId, parsed.data.reason);
        return { ok: true, message: "Venta anulada. El stock fue devuelto al inventario." };
    }
}

const controller = new VentasController();
export const ventasLoader = controller.loader;
export const ventasAction = controller.action;