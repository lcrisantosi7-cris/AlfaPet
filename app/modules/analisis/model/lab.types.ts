export type LabStatus = "solicitado" | "muestra_tomada" | "en_proceso" | "completado" | "cancelado";

export interface LabOrderRow {
    id: string;
    createdAt: string;
    status: LabStatus;
    patientName: string;
    species: string;
    requesterName: string | null;
    /** Recepción no tiene acceso a los ítems: llegan en 0. */
    itemCount: number;
    resultedCount: number;
}

export interface LabItem {
    id: string;
    name: string;
    sampleType: string | null;
    price: number;
    resultValue: string | null;
    resultUnit: string | null;
    referenceRange: string | null;
    resultNotes: string | null;
    resultedAt: string | null;
    resultedByName: string | null;
}

export interface LabOrderDetail {
    id: string;
    createdAt: string;
    status: LabStatus;
    notes: string | null;
    patientName: string;
    species: string;
    breed: string | null;
    ownerName: string | null;
    requesterName: string | null;
    items: LabItem[];
}

export interface LabPatientOption {
    id: string;
    name: string;
    species: string;
    ownerName: string | null;
}

export interface LabAnalysisOption {
    id: number;
    name: string;
    sampleType: string | null;
    price: number;
}

export type AnalisisResult = {
    ok: boolean;
    message: string;
    intent?: "create" | "sample" | "process" | "result" | "complete" | "cancel";
};