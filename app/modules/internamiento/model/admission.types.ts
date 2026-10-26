export type KennelKind = "jaula" | "cama" | "aislamiento";
export type AdmissionStatus = "internado" | "alta" | "fallecido";

export interface KennelOccupant {
    admissionId: string;
    patientName: string;
    admittedAt: string;
    /** Día de internamiento: 1 el día del ingreso. */
    day: number;
    /** Solo para personal clínico. */
    reason?: string;
    vetName?: string | null;
}

export interface KennelCard {
    id: number;
    code: string;
    name: string;
    kind: KennelKind;
    occupant: KennelOccupant | null;
}

export interface AdmissiblePatient {
    id: string;
    name: string;
    species: string;
    ownerName: string | null;
}

export interface VetOption {
    id: string;
    name: string;
}

export interface AdmissionNote {
    id: number;
    note: string;
    weightKg: number | null;
    temperatureC: number | null;
    authorName: string | null;
    createdAt: string;
}

export interface AdmissionDetail {
    id: string;
    status: AdmissionStatus;
    reason: string;
    diagnosis: string | null;
    admittedAt: string;
    dischargedAt: string | null;
    dischargeNotes: string | null;
    dailyRate: number;
    day: number;
    kennel: { code: string; name: string };
    patient: { id: string; name: string; species: string; breed: string | null };
    ownerName: string | null;
    ownerPhone: string | null;
    vetName: string | null;
    notes: AdmissionNote[];
}

export type InternamientoResult = {
    ok: boolean;
    message: string;
    intent?: "admit" | "note" | "discharge";
};