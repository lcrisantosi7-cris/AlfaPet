import type { BadgeVariant } from "~/core/ui/Badge";

export const speciesLabel = (v: string) => v.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const dateLabel = (v: string | null | undefined) =>
    v ? new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(v.slice(0, 10) + "T00:00:00Z")) : "No registrada";

export function ageLabel(birth: string | null) {
    if (!birth) return "Edad no registrada";
    const b = new Date(birth + "T00:00:00Z");
    const n = new Date();
    let m = (n.getUTCFullYear() - b.getUTCFullYear()) * 12 + n.getUTCMonth() - b.getUTCMonth();
    if (n.getUTCDate() < b.getUTCDate()) m--;
    if (m < 1) return "Menos de 1 mes";
    if (m < 12) return `${m} ${m === 1 ? "mes" : "meses"}`;
    const y = Math.floor(m / 12), r = m % 12;
    return `${y} ${y === 1 ? "año" : "años"}${r ? ` y ${r} m` : ""}`;
}

export function patientState(p: { lifeStatus: string; isActive: boolean }): { label: string; variant: BadgeVariant } {
    if (p.lifeStatus === "fallecido") return { label: "Fallecido", variant: "neutral" };
    return p.isActive ? { label: "Activo", variant: "success" } : { label: "Inactivo", variant: "warning" };
}

export const WEIGHT_SOURCE: Record<string, string> = { registro: "Registro inicial", consulta: "Consulta", manual: "Actualización manual" };