import { z } from "zod";

/** "2026-10-30T09:30" (hora de Lima, sin zona) → Date. */
const limaDateTime = z
    .string("Indica la fecha y hora")
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Fecha y hora no válidas")
    .transform((value) => new Date(`${value}:00-05:00`))
    .refine((date) => !Number.isNaN(date.getTime()), "Fecha y hora no válidas");

export const scheduleSchema = z.object({
    patientId: z.uuid("Elige un paciente"),
    serviceId: z.coerce.number("Elige el procedimiento").int().positive("Elige el procedimiento"),
    surgeonId: z.uuid().optional(),
    scheduledAt: limaDateTime,
    price: z.coerce.number("Precio no válido").min(0, "El precio no puede ser negativo").max(1_000_000),
    preOpNotes: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
});

export const checklistSchema = z.object({
    surgeryId: z.uuid(),
    consentSigned: z.boolean(),
    fastingConfirmed: z.boolean(),
});

export const notesSchema = z.object({
    surgeryId: z.uuid(),
    preOpNotes: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
    anesthesiaNotes: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
    procedureNotes: z.string().trim().max(4000, "Máximo 4000 caracteres").optional(),
    postOpInstructions: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
});

export const transitionSchema = z.object({ surgeryId: z.uuid() });

export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type ChecklistInput = z.infer<typeof checklistSchema>;
export type NotesInput = z.infer<typeof notesSchema>;