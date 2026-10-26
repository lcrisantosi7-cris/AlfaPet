import type { BadgeVariant } from "~/core/ui/Badge";
import type { ProductKind, ProductRow } from "../model/producto.types";

export const KIND_LABEL: Record<ProductKind, string> = { pet_shop: "Pet Shop", farmacia: "Farmacia", insumo: "Insumos" };
export const KIND_VARIANT: Record<ProductKind, BadgeVariant> = { pet_shop: "brand", farmacia: "info", insumo: "neutral" };
export const UNITS = ["unidad", "caja", "frasco", "blister", "tableta", "bolsa", "kg", "litro", "sobre"];
export const SERVICE_CATEGORY_LABEL: Record<string, string> = {
    consulta: "Consultas", cirugia: "Cirugías", analisis: "Análisis", internamiento: "Internamiento", otro: "Otros",
};

export function stockState(p: Pick<ProductRow, "isActive" | "stock" | "minStock">): { label: string; variant: BadgeVariant } {
    if (!p.isActive) return { label: "Inactivo", variant: "neutral" };
    if (p.stock <= 0) return { label: "Agotado", variant: "danger" };
    if (p.stock <= p.minStock) return { label: "Stock bajo", variant: "warning" };
    return { label: "Disponible", variant: "success" };
}