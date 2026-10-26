import { z } from "zod";

export const admitSchema = z.object({
    kennelId: z.coerce.number("Elige una habitación").int().positive("Elige una habitación"),
    patientId: z.uuid("Elige un paciente"),
    vetId: z.uuid().optional(),
    reason: z.string().trim().min(1, "Indica el motivo del internamiento").max(1000, "Máximo 1000 caracteres"),
    diagnosis: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
    dailyRate: z.coerce.number("Tarifa no válida").min(0, "La tarifa no puede ser negativa").max(100000),
});

export const noteSchema = z.object({
    admissionId: z.uuid(),
    note: z.string().trim().min(1, "Escribe la nota de evolución").max(2000, "Máximo 2000 caracteres"),
    weightKg: z.coerce.number("Peso no válido").positive("Peso no válido").max(5000).optional(),
    temperatureC: z.coerce.number("Temperatura no válida").min(30, "Temperatura entre 30 y 45 °C").max(45, "Temperatura entre 30 y 45 °C").optional(),
});

export const dischargeSchema = z.object({
    admissionId: z.uuid(),
    outcome: z.enum(["alta", "fallecido"], "Elige el resultado"),
    notes: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
});

export type AdmitInput = z.infer<typeof admitSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type DischargeInput = z.infer<typeof dischargeSchema>;