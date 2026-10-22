import { z } from "zod";

const optionalText = (max: number) =>
    z
        .string()
        .trim()
        .max(max, `Máximo ${max} caracteres`)
        .transform((value) => value || undefined)
        .optional();

const optionalEmail = z
    .string()
    .trim()
    .max(160, "Máximo 160 caracteres")
    .refine((value) => value === "" || z.email().safeParse(value).success, "Correo no válido")
    .transform((value) => value || undefined)
    .optional();

const optionalBirthDate = z
    .string()
    .refine(
        (value) => value === "" || (/^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value) <= new Date()),
        "Fecha no válida",
    )
    .transform((value) => value || undefined)
    .optional();

const optionalWeight = z
    .string()
    .refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) > 0), "Peso no válido")
    .transform((value) => (value === "" ? undefined : Number(value)))
    .optional();

/** Reglas de entrada del formulario "Nuevo paciente" (el servidor es la autoridad). */
export const newPatientSchema = z.object({
    ownerName: z.string().trim().min(2, "Ingresa el nombre del dueño").max(120, "Máximo 120 caracteres"),
    ownerPhone: optionalText(30),
    ownerEmail: optionalEmail,
    ownerDocument: optionalText(20),
    ownerAddress: optionalText(200),
    name: z.string().trim().min(1, "Ingresa el nombre del paciente").max(80, "Máximo 80 caracteres"),
    species: z.string().trim().min(1, "Elige la especie"),
    breed: optionalText(80),
    sex: optionalText(30),
    birthDate: optionalBirthDate,
    weightKg: optionalWeight,
    microchip: optionalText(30),
});

export type NewPatientInput = z.output<typeof newPatientSchema>;