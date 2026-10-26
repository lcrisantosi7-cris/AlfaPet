export interface VaccinationRow {
    id: string; dueDate: string; appliedAt: string | null; lot: string | null; notes: string | null;
    patientId: string; patientName: string; species: string; ownerName: string | null;
    vaccineId: number; vaccineName: string; byName: string | null;
}
export interface VaccineOption { id: number; name: string; intervalDays: number | null }
export interface VaccinePatientOption { id: string; name: string; ownerName: string | null }
export type VacunaActionResult = { ok: boolean; message?: string; intent?: string; fieldErrors?: Record<string, string[] | undefined> };