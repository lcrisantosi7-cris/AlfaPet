import type { BadgeVariant } from "~/core/ui/Badge";
import type { LabStatus } from "../model/lab.types";

export const STATUS_LABEL: Record<LabStatus, string> = {
    solicitado: "Solicitado",
    muestra_tomada: "Muestra tomada",
    en_proceso: "En proceso",
    completado: "Completado",
    cancelado: "Cancelado",
};

export const STATUS_VARIANT: Record<LabStatus, BadgeVariant> = {
    solicitado: "info",
    muestra_tomada: "brand",
    en_proceso: "warning",
    completado: "success",
    cancelado: "neutral",
};

const dateTime = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));