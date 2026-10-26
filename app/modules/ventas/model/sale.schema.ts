import { z } from "zod";

const quantity = z.number().int().min(1).max(999);

const cartItem = z.discriminatedUnion("type", [
    z.object({ type: z.literal("product"), id: z.uuid(), quantity }),
    z.object({ type: z.literal("service"), id: z.number().int().positive(), quantity }),
]);

export const checkoutSchema = z.object({
    paymentMethod: z.enum(["efectivo", "yape", "plin", "tarjeta", "transferencia"], "Elige un método de pago"),
    ownerId: z.uuid().optional(),
    prescriptionId: z.uuid().optional(),
    notes: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
    items: z.array(cartItem).min(1, "Agrega al menos un ítem").max(100, "Máximo 100 ítems por venta"),
});

export const voidSchema = z.object({
    saleId: z.uuid(),
    reason: z.string().trim().min(3, "Indica el motivo de la anulación").max(300, "Máximo 300 caracteres"),
});

export type CartItemInput = z.infer<typeof cartItem>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;