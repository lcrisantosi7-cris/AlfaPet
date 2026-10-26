import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { AppError, NotFoundError } from "~/core/errors/app-error";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import { productUpdateSchema, stockAdjustSchema } from "../model/producto.schema";
import { ProductoRepository } from "../model/producto.repository.server";

const ROLES = ["admin", "recepcion"] as const;

export async function productoDetailLoader({ request, params }: LoaderFunctionArgs) {
    const id = z.uuid().safeParse(params.id);
    if (!id.success) throw new NotFoundError("Producto no encontrado").toResponse();
    const { supabase, headers } = await requireUser(request, ROLES);
    const repo = new ProductoRepository(supabase);
    const [product, categories] = await Promise.all([repo.getDetail(id.data), repo.categories()]);
    if (!product) throw new NotFoundError("Producto no encontrado").toResponse();
    return data({ product, categories }, { headers });
}

export async function productoDetailAction({ request, params }: ActionFunctionArgs) {
    assertSameOrigin(request);
    const { supabase, headers } = await requireUser(request, ROLES);
    const raw = Object.fromEntries(await request.formData());
    const intent = String(raw.intent ?? "");
    const id = z.uuid().safeParse(params.id);
    const fail = (message: string, status = 400, extra: object = {}) => data({ ok: false, intent, message, ...extra }, { status, headers });
    if (!id.success) return fail("Producto no válido.");
    const repo = new ProductoRepository(supabase);

    try {
        if (intent === "update") {
            const p = productUpdateSchema.safeParse(raw);
            if (!p.success) return fail("Revisa los campos marcados.", 400, { fieldErrors: z.flattenError(p.error).fieldErrors });
            await repo.update(id.data, p.data);
            return data({ ok: true, intent, message: "Producto actualizado." }, { headers });
        }
        if (intent === "toggle-active") {
            const active = String(raw.isActive) === "true";
            await repo.toggleActive(id.data, !active);
            return data({ ok: true, intent, message: active ? "Producto desactivado." : "Producto reactivado." }, { headers });
        }
        if (intent === "adjust-stock") {
            const p = stockAdjustSchema.safeParse(raw);
            if (!p.success) return fail("Revisa los datos del movimiento.", 400, { fieldErrors: z.flattenError(p.error).fieldErrors });
            await repo.adjustStock(id.data, p.data.type === "entrada" ? p.data.quantity : -p.data.quantity, p.data.reason);
            return data({ ok: true, intent, message: "Existencias actualizadas." }, { headers });
        }
        return fail("Operación no válida.");
    } catch (error) {
        if (!(error instanceof AppError)) throw error;
        return fail(error.message, error.status);
    }
}