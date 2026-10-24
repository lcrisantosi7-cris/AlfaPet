export type Species = string;
export type AppointmentStatus = "confirmada" | "pendiente";
export type StatKind = "patients" | "appointmentsToday" | "pendingVaccines" | "productsInStock";

export interface DashboardStat {
  kind: StatKind;
  value: number;
}

export interface WeekdayAppointments {
  day: string;
  total: number;
}

export interface CareTypeShare {
  label: string;
  percent: number;
}

export interface AppointmentSummary {
  id: string;
  petName: string;
  reason: string;
  scheduleLabel: string;
  status: AppointmentStatus;
  photoUrl?: string;
}

export interface PatientSummary {
  id: string;
  name: string;
  species: Species;
  breed: string;
  ownerName: string;
  /** Fecha ISO: "2026-04-12" */
  registeredAt: string;
  photoUrl?: string;
}

export interface VetAgendaAppointment {
  id: string;
  startsAt: string;
  scheduleLabel: string;
  status: string;
  petName: string;
  species: string;
  ownerName: string;
  careType: string;
}

export interface VetAgenda {
  assigned: VetAgendaAppointment[];
  unassigned: VetAgendaAppointment[];
}

export interface DashboardSnapshot {
  stats: DashboardStat[];
  weekly: WeekdayAppointments[];
  careTypes: CareTypeShare[];
  upcoming: AppointmentSummary[];
  recentPatients: PatientSummary[];
}

/** Contrato de acceso a datos: hoy es un mock, mañana Supabase, sin tocar vistas ni controlador. */
export interface DashboardRepository {
  getSnapshot(): Promise<DashboardSnapshot>;
}
