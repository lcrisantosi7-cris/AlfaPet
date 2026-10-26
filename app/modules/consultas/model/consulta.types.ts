export interface ConsultaRow {
    id: string; createdAt: string; patientId: string; patientName: string; species: string;
    ownerName: string | null; vetName: string | null; appointmentLabel: string | null; weightKg: number | null;
}
export interface ConsultaDetail extends ConsultaRow {
    temperatureC: number | null; symptoms: string | null; diagnosis: string | null; treatment: string | null; notes: string | null;
    careType: string | null; currentWeightKg: number | null; ownerPhone: string | null; breed: string | null;
}
export interface PatientOption { id: string; name: string; ownerName: string | null; currentWeightKg: number | null }
export interface AppointmentOption { id: string; patientId: string; label: string }
export type ConsultaFieldErrors = Record<string, string[] | undefined>;
export type ConsultaActionResult = { ok: boolean; message?: string; intent?: string; fieldErrors?: ConsultaFieldErrors };