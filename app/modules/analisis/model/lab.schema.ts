import { z } from "zod";

export const createOrderSchema = z.object({
    patientId: z.uuid("Elige un paciente"),
    serviceIds: z
        .array(z.coerce.number().int().positive())
        .min(1, "Selecciona al menos un análisis")
        .max(30, "Máximo 30 análisis por orden"),
    notes: z.string().trim().max(1000, "Máximo 1000 caracteres").optional(),
});

export const resultSchema = z.object({
    orderId: z.uuid(),
    itemId: z.uuid(),
    value: z.string().trim().min(1, "Ingresa el resultado").max(500, "Máximo 500 caracteres"),
    unit: z.string().trim().max(40, "Unidad: máximo 40 caracteres").optional(),
    range: z.string().trim().max(100, "Rango: máximo 100 caracteres").optional(),
    notes: z.string().trim().max(1000, "Máximo 1000 caracteres").optional(),
});

export const orderIdSchema = z.object({ orderId: z.uuid() });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ResultInput = z.infer<typeof resultSchema>;