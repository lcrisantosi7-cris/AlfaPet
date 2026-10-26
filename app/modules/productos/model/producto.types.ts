export type ProductKind = "pet_shop" | "farmacia" | "insumo";

export interface ProductRow {
    id: string; sku: string; name: string; kind: ProductKind; category: string | null; categoryId: number | null;
    price: number; stock: number; minStock: number; isActive: boolean; requiresPrescription: boolean;
}
export interface StockMovement { id: number; delta: number; reason: string; createdAt: string; author: string | null }
export interface ProductDetail extends ProductRow {
    description: string | null; brand: string | null; unit: string; expiresAt: string | null; createdAt: string; movements: StockMovement[];
}
export interface CategoryOption { id: number; name: string }
export interface ServiceRow { id: number; code: string; name: string; category: string; basePrice: number; isActive: boolean }
export type ProductoActionResult = { ok: boolean; message?: string; intent?: string; fieldErrors?: Record<string, string[] | undefined> };