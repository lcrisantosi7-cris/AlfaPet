import type { AdmissionStatus, KennelKind } from "../model/admission.types";

export const KIND_LABEL: Record<KennelKind, string> = {
    jaula: "Habitación",
    cama: "Cama",
    aislamiento: "Aislamiento",
};

export const STATUS_LABEL: Record<AdmissionStatus, string> = {
    internado: "Internado",
    alta: "Alta",
    fallecido: "Fallecido",
};

const dateTime = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));