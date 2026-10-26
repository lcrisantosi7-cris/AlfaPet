import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { AppError } from "~/core/errors/app-error";
import { assertSameOrigin } from "~/core/security/same-origin.server";
import { requireUser } from "~/modules/auth/controller/session.controller.server";
import { productSchema, servicePriceSchema } from "../model/producto.schema";
import { ProductoRepository } from "../model/producto.repository.server";

const ROLES = ["admin", "recepcion"] as const;

export async function productosLoader({ request }: LoaderFunctionArgs) {
    const { supabase, headers, user } = await requireUser(request, ROLES);
    const repo = new ProductoRepository(supabase);
    const [products, categories, services] = await Promise.all([repo.list(), repo.categories(), repo.services()]);
    return data({ products, categories, services, isAdmin: user.role === "admin" }, { headers });
}

export async function productosAction({ request }: ActionFunctionArgs) {
    assertSameOrigin(request);
    const { supabase, headers, user } = await requireUser(request, ROLES);
    const raw = Object.fromEntries(await request.formData());
    const intent = String(raw.intent ?? "");
    const repo = new ProductoRepository(supabase);
    const fail = (message: string, status = 400, extra: object = {}) => data({ ok: false, intent, message, ...extra }, { status, headers });

    try {
        if (intent === "create") {
            const p = productSchema.safeParse(raw);
            if (!p.success) return fail("Revisa los campos marcados.", 400, { fieldErrors: z.flattenError(p.error).fieldErrors });
            await repo.create(p.data);
            return data({ ok: true, intent, message: "Producto registrado correctamente." }, { headers });
        }
        if (intent === "service-price") {
            if (user.role !== "admin") return fail("Solo administración puede cambiar las tarifas.", 403);
            const p = servicePriceSchema.safeParse(raw);
            if (!p.success) return fail("Ingresa un costo válido.");
            await repo.setServicePrice(p.data.serviceId, p.data.price);
            return data({ ok: true, intent, message: "Costo del servicio actualizado." }, { headers });
        }
        return fail("Operación no válida.");
    } catch (error) {
        if (!(error instanceof AppError)) throw error;
        return fail(error.message, error.status);
    }
}