import type { NewPatientInput } from "./patient.schema";

/** Valores válidos de los enums de Supabase (se leen de la base, no se escriben a mano). */
export interface PatientOptions {
    species: string[];
    sex: string[];
}

export type PatientFieldErrors = { [Field in keyof NewPatientInput]?: string[] };

export type CreatePatientResult =
    | { ok: true; id: string }
    | { ok: false; fieldErrors?: PatientFieldErrors; formError?: string };