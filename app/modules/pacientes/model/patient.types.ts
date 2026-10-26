import type { NewPatientInput } from "./patient.schema";

export interface PatientOptions {
    species: string[];
    sex: string[];
}

export type PatientFieldErrors = { [Field in keyof NewPatientInput]?: string[] };

export type CreatePatientResult =
    | { ok: true; id: string }
    | { ok: false; fieldErrors?: PatientFieldErrors; formError?: string };

export interface OwnerOption {
    id: string;
    name: string;
    phone?: string;
    document?: string;
    petCount: number;
}

export interface PatientListRow {
    id: string; name: string; species: string; breed: string | null; sex: string | null;
    birthDate: string | null; currentWeightKg: number | null; microchip: string | null;
    isActive: boolean; lifeStatus: string; createdAt: string;
    ownerId?: string; ownerName?: string; ownerPhone?: string; ownerDocument?: string;
}

export interface PatientDetailData {
    patient: {
        id: string; name: string; species: string; breed: string | null; sex: string | null;
        birthDate: string | null; initialWeightKg: number | null; currentWeightKg: number | null;
        weightUpdatedAt: string | null; microchip: string | null; color: string | null;
        isSterilized: boolean | null; allergies: string | null; notes: string | null;
        isActive: boolean; lifeStatus: string; deceasedAt: string | null; deceasedNotes: string | null; createdAt: string;
    };
    owner: { id: string; name: string; phone: string | null; email: string | null; document: string | null; address: string | null };
    otherPets: { id: string; name: string; species: string; lifeStatus: string; isActive: boolean }[];
    weights: { id: number; weightKg: number; source: string; recordedAt: string }[];
    consultations: { id: string; date: string; diagnosis: string | null; vet: string | null }[];
    vaccinations: { id: string; vaccine: string; dueDate: string; appliedAt: string | null }[];
    options: PatientOptions;
    canEdit: boolean;
    isAdmin: boolean;
}