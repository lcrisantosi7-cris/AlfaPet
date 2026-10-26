import { z } from "zod";

const optText = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`).transform((v) => v || undefined).optional();
const money = (label: string) =>
    z.string().trim().refine((v) => v !== "" && Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 100000000, `${label} no válido`).transform(Number);
const intField = (label: string, min = 0) =>
    z.string().trim().refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= min), `${label} no válido`).transform((v) => (v === "" ? 0 : Number(v))).optional();

export const productSchema = z.object({
    sku: z.string().trim().min(1, "Ingresa el SKU").max(40, "Máximo 40 caracteres").transform((v) => v.toUpperCase()),
    name: z.string().trim().min(1, "Ingresa el nombre").max(120, "Máximo 120 caracteres"),
    kind: z.enum(["pet_shop", "farmacia", "insumo"], "Elige el tipo"),
    categoryId: z.string().trim().refine((v) => v === "" || /^\d+$/.test(v), "Categoría no válida").transform((v) => (v === "" ? undefined : Number(v))).optional(),
    price: money("El precio"),
    stock: intField("El stock"),
    minStock: intField("El stock mínimo"),
    brand: optText(80),
    unit: optText(20),
    expiresAt: z.string().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Fecha no válida").transform((v) => v || undefined).optional(),
    requiresPrescription: z.string().optional().transform((v) => v === "on" || v === "true"),
    description: optText(500),
});

export const productUpdateSchema = productSchema.omit({ stock: true });

export const stockAdjustSchema = z.object({
    type: z.enum(["entrada", "salida"], "Elige el tipo de movimiento"),
    quantity: z.string().trim().refine((v) => /^\d+$/.test(v) && Number(v) > 0 && Number(v) <= 1000000, "Cantidad no válida").transform(Number),
    reason: z.string().trim().min(1, "Indica el motivo").max(200, "Máximo 200 caracteres"),
});

export const servicePriceSchema = z.object({
    serviceId: z.coerce.number().int().positive(),
    price: money("El costo"),
});

export type ProductInput = z.output<typeof productSchema>;
export type ProductUpdateInput = z.output<typeof productUpdateSchema>;