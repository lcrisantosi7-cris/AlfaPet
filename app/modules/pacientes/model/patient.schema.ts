import { z } from "zod";

const optionalText = (max: number) =>
    z.string().trim().max(max, `Máximo ${max} caracteres`).transform((v) => v || undefined).optional();

const optionalDigits = (length: number, label: string) =>
    z.string().trim()
        .refine((v) => v === "" || new RegExp("^[0-9]{" + length + "}$").test(v), `${label} debe contener exactamente ${length} dígitos`)
        .transform((v) => v || undefined).optional();

const optionalEmail = z.string().trim().max(160, "Máximo 160 caracteres")
    .refine((v) => v === "" || z.email().safeParse(v).success, "Correo no válido")
    .transform((v) => v || undefined).optional();

const optionalBirthDate = z.string()
    .refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(v) <= new Date()), "Fecha no válida")
    .transform((v) => v || undefined).optional();

const optionalWeight = z.string()
    .refine((v) => v === "" || (Number.isFinite(Number(v)) && Number(v) > 0 && Number(v) <= 5000), "Peso no válido")
    .transform((v) => (v === "" ? undefined : Number(v))).optional();

const optionalUuid = z.string().trim()
    .refine((v) => v === "" || z.uuid().safeParse(v).success, "Dueño no válido")
    .transform((v) => v || undefined).optional();

const ownerFields = {
    ownerPhone: optionalDigits(9, "El teléfono"),
    ownerEmail: optionalEmail,
    ownerDocument: optionalDigits(8, "El DNI"),
    ownerAddress: optionalText(200),
};

const patientFields = {
    name: z.string().trim().min(1, "Ingresa el nombre del paciente").max(80, "Máximo 80 caracteres"),
    species: z.string().trim().min(1, "Elige la especie"),
    breed: optionalText(80),
    sex: optionalText(30),
    birthDate: optionalBirthDate,
    microchip: optionalText(30),
};

/** Alta de paciente: dueño nuevo (ownerName obligatorio) o dueño existente (ownerId). */
export const newPatientSchema = z
    .object({
        ownerId: optionalUuid,
        ownerName: z.string().trim().max(120, "Máximo 120 caracteres").optional(),
        ...ownerFields,
        ...patientFields,
        weightKg: optionalWeight,
    })
    .superRefine((v, ctx) => {
        if (!v.ownerId && (v.ownerName ?? "").length < 2) {
            ctx.addIssue({ code: "custom", path: ["ownerName"], message: "Ingresa el nombre del dueño" });
        }
    });

export const updatePatientSchema = z.object({
    ownerName: z.string().trim().min(2, "Ingresa el nombre del dueño").max(120, "Máximo 120 caracteres"),
    ...ownerFields,
    ...patientFields,
    currentWeightKg: optionalWeight,
    color: optionalText(40),
    allergies: optionalText(300),
    notes: optionalText(1000),
    isSterilized: z.enum(["", "true", "false"]).optional(),
});

export const deceasedSchema = z.object({
    deceasedAt: z.string().refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && v <= new Date().toISOString().slice(0, 10), "Fecha no válida"),
    deceasedNotes: optionalText(500),
});

export type NewPatientInput = z.output<typeof newPatientSchema>;