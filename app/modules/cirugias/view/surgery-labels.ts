import type { BadgeVariant } from "~/core/ui/Badge";
import type { SurgeryStatus } from "../model/surgery.types";

export const STATUS_LABEL: Record<SurgeryStatus, string> = {
    programada: "Programada",
    en_curso: "En curso",
    completada: "Completada",
    cancelada: "Cancelada",
};

export const STATUS_VARIANT: Record<SurgeryStatus, BadgeVariant> = {
    programada: "info",
    en_curso: "warning",
    completada: "success",
    cancelada: "neutral",
};

const dateTime = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));