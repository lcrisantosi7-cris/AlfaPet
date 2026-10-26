import { BadRequestError, ConflictError } from "~/core/errors/app-error";
import type { SupabaseServerClient } from "~/core/supabase/client.server";
import type { ProductInput, ProductUpdateInput } from "./producto.schema";
import type { CategoryOption, ProductDetail, ProductRow, ServiceRow, StockMovement } from "./producto.types";

const one = (v: any) => (Array.isArray(v) ? v[0] : v);
const toRow = (p: any): ProductRow => ({
    id: p.id, sku: p.sku, name: p.name, kind: p.kind, category: p.category, categoryId: p.category_id,
    price: Number(p.price), stock: Number(p.stock), minStock: Number(p.min_stock), isActive: Boolean(p.is_active),
    requiresPrescription: Boolean(p.requires_prescription),
});

export class ProductoRepository {
    constructor(private readonly supabase: SupabaseServerClient) { }

    async list(): Promise<ProductRow[]> {
        const { data, error } = await this.supabase
            .from("products").select("id,sku,name,kind,category,category_id,price,stock,min_stock,is_active,requires_prescription").order("name").limit(1000);
        if (error) throw new Response("No se pudo cargar el inventario.", { status: 500 });
        return (data ?? []).map(toRow);
    }

    async categories(): Promise<CategoryOption[]> {
        const { data } = await this.supabase.from("product_categories").select("id,name").eq("is_active", true).order("name");
        return (data ?? []).map((c: any) => ({ id: c.id, name: c.name }));
    }

    async services(): Promise<ServiceRow[]> {
        const { data } = await this.supabase.from("services").select("id,code,name,category,base_price,is_active").order("category").order("name");
        return (data ?? []).map((s: any) => ({ id: s.id, code: s.code, name: s.name, category: s.category, basePrice: Number(s.base_price), isActive: Boolean(s.is_active) }));
    }

    async getDetail(id: string): Promise<ProductDetail | null> {
        const { data: p } = await this.supabase
            .from("products")
            .select("id,sku,name,kind,category,category_id,price,stock,min_stock,is_active,requires_prescription,description,brand,unit,expires_at,created_at")
            .eq("id", id).maybeSingle();
        if (!p) return null;
        const { data: mv } = await this.supabase
            .from("stock_movements")
            .select("id,delta,reason,created_at,author:profiles!stock_movements_created_by_fkey(full_name)")
            .eq("product_id", id).order("created_at", { ascending: false }).limit(12);
        const movements: StockMovement[] = (mv ?? []).map((m: any) => ({ id: m.id, delta: m.delta, reason: m.reason, createdAt: m.created_at, author: one(m.author)?.full_name ?? null }));
        return { ...toRow(p), description: p.description, brand: p.brand, unit: p.unit ?? "unidad", expiresAt: p.expires_at, createdAt: p.created_at, movements };
    }

    private async categoryName(categoryId?: number) {
        if (!categoryId) return null;
        const { data } = await this.supabase.from("product_categories").select("name").eq("id", categoryId).eq("is_active", true).maybeSingle();
        if (!data) throw new BadRequestError("La categoría seleccionada no está disponible.");
        return data.name as string;
    }

    async create(input: ProductInput): Promise<string> {
        const category = await this.categoryName(input.categoryId);
        const { data, error } = await this.supabase.from("products").insert({
            sku: input.sku, name: input.name, kind: input.kind, category, category_id: input.categoryId ?? null,
            price: input.price, stock: 0, min_stock: input.minStock ?? 0, brand: input.brand ?? null, unit: input.unit ?? "unidad",
            expires_at: input.expiresAt ?? null, description: input.description ?? null,
            requires_prescription: input.kind === "farmacia" ? input.requiresPrescription : false,
        }).select("id").single();
        if (error) throw error.code === "23505" ? new ConflictError("Ya existe un producto con ese SKU.") : new BadRequestError("No se pudo registrar el producto.");

        if ((input.stock ?? 0) > 0) {
            await this.supabase.from("stock_movements").insert({ product_id: data.id, delta: input.stock, reason: "Stock inicial" });
        }
        return data.id as string;
    }

    async update(id: string, v: ProductUpdateInput): Promise<void> {
        const category = await this.categoryName(v.categoryId);
        const { error } = await this.supabase.from("products").update({
            sku: v.sku, name: v.name, kind: v.kind, category, category_id: v.categoryId ?? null, price: v.price,
            min_stock: v.minStock ?? 0, brand: v.brand ?? null, unit: v.unit ?? "unidad", expires_at: v.expiresAt ?? null,
            description: v.description ?? null, requires_prescription: v.kind === "farmacia" ? v.requiresPrescription : false,
        }).eq("id", id);
        if (error) throw error.code === "23505" ? new ConflictError("Ya existe un producto con ese SKU.") : new BadRequestError("No se pudo actualizar el producto.");
    }

    async toggleActive(id: string, isActive: boolean): Promise<void> {
        const { error } = await this.supabase.from("products").update({ is_active: isActive }).eq("id", id);
        if (error) throw new BadRequestError("No se pudo cambiar el estado.");
    }

    async adjustStock(id: string, delta: number, reason: string): Promise<void> {
        const { error } = await this.supabase.from("stock_movements").insert({ product_id: id, delta, reason });
        if (error) throw new BadRequestError("No se pudo ajustar. Verifica que la salida no deje el stock en negativo.");
    }

    async setServicePrice(id: number, price: number): Promise<void> {
        const { data, error } = await this.supabase.from("services").update({ base_price: price }).eq("id", id).select("id");
        if (error || !data?.length) throw new BadRequestError("No se pudo actualizar el costo (solo administración).");
    }
}