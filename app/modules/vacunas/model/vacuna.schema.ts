import { z } from "zod";
import { limaToday } from "./vacuna-dates";

const date = (label: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${label} no válida`);
const optText = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`).transform((v) => v || undefined).optional();
const appliedAt = z.string()
    .refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && v <= limaToday()), "La fecha de aplicación no puede ser futura")
    .transform((v) => v || undefined).optional();

export const vaccinationCreateSchema = z.object({
    patientId: z.uuid("Selecciona un paciente"),
    vaccineId: z.coerce.number("Selecciona la vacuna").int().positive("Selecciona la vacuna"),
    appliedAt,
    dueDate: date("La fecha de próxima dosis"),
    lot: optText(40),
    notes: optText(500),
});

export const vaccinationUpdateSchema = vaccinationCreateSchema.omit({ patientId: true, vaccineId: true });
export type VaccinationCreateInput = z.output<typeof vaccinationCreateSchema>;
export type VaccinationUpdateInput = z.output<typeof vaccinationUpdateSchema>;