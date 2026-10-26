export type SurgeryStatus = "programada" | "en_curso" | "completada" | "cancelada";

export interface SurgeryRow {
    id: string;
    scheduledAt: string;
    status: SurgeryStatus;
    consentSigned: boolean;
    fastingConfirmed: boolean;
    price: number;
    patientName: string;
    species: string;
    procedure: string;
    surgeonName: string | null;
}

export interface SurgeryDetail extends SurgeryRow {
    patientId: string;
    breed: string | null;
    ownerName: string | null;
    ownerPhone: string | null;
    preOpNotes: string | null;
    anesthesiaNotes: string | null;
    procedureNotes: string | null;
    postOpInstructions: string | null;
    startedAt: string | null;
    endedAt: string | null;
}

export interface SurgeryPatientOption {
    id: string;
    name: string;
    species: string;
    ownerName: string | null;
}

export interface SurgeryServiceOption {
    id: number;
    name: string;
    price: number;
}

export interface SurgeonOption {
    id: string;
    name: string;
}

export type CirugiasResult = {
    ok: boolean;
    message: string;
    intent?: "schedule" | "checklist" | "notes" | "start" | "complete" | "cancel";
};