import { z } from "zod";

const optText = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`).transform((v) => v || undefined).optional();
const optNum = (min: number, max: number, label: string) =>
    z.string().refine((v) => v === "" || (Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max), `${label} fuera de rango (${min}–${max})`)
        .transform((v) => (v === "" ? undefined : Number(v))).optional();

export const consultaSchema = z.object({
    patientId: z.uuid("Selecciona un paciente"),
    appointmentId: z.string().trim().refine((v) => v === "" || z.uuid().safeParse(v).success, "Cita no válida").transform((v) => v || undefined).optional(),
    weightKg: optNum(0.01, 5000, "El peso"),
    temperatureC: optNum(30, 45, "La temperatura"),
    symptoms: optText(2000),
    diagnosis: z.string().trim().min(1, "Escribe el diagnóstico").max(2000, "Máximo 2000 caracteres"),
    treatment: optText(2000),
    notes: optText(2000),
});

export const consultaUpdateSchema = consultaSchema.omit({ patientId: true, appointmentId: true });
export type ConsultaInput = z.output<typeof consultaSchema>;
export type ConsultaUpdateInput = z.output<typeof consultaUpdateSchema>;