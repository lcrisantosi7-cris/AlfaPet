export interface Datum { label: string; value: number }
export interface ReportAlert { level: "danger" | "warning" | "info" | "success"; title: string; detail: string; href?: string }

export interface ReporteData {
    range: { from: string; to: string; days: number; preset: number | null; bucket: "day" | "week" | "month" };
    labels: string[];
    kpis: {
        revenue: number; revenuePrev: number; sales: number; salesPrev: number; avgTicket: number; voided: number;
        appointments: number; appointmentsPrev: number; consultations: number; newPatients: number; vaccinesApplied: number;
        occupied: number; capacity: number;
    };
    revenueSeries: number[];
    appointmentsSeries: number[];
    consultationsSeries: number[];
    byChannel: Datum[]; byPayment: Datum[]; topItems: Datum[];
    apptStatus: Datum[]; careTypes: Datum[]; byVet: Datum[];
    species: Datum[]; patientStatus: Datum[]; inventoryByKind: Datum[]; vaccination: Datum[];
    inventory: { value: number; products: number; low: number; out: number; expiring: number };
    alerts: ReportAlert[];
}