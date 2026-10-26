import type { PostgrestError } from "@supabase/supabase-js";
import { AppError, BadRequestError, ForbiddenError, NotFoundError } from "~/core/errors/app-error";
import type { SupabaseServerClient } from "~/core/supabase/client.server";
import type { CartItemInput, CheckoutInput } from "./sale.schema";
import type {
    CatalogProduct,
    PosCatalog,
    SaleChannel,
    SaleSummary,
} from "./sale.types";

const HISTORY_LIMIT = 150;
const PRESCRIPTION_WINDOW_DAYS = 60;

/** Errores de negocio lanzados por las funciones SQL: su mensaje ya está en español. */
const BUSINESS_CODES = new Set(["22023", "23514", "P0002"]);

export class SaleRepository {
    constructor(private readonly supabase: SupabaseServerClient) { }

    async getPosCatalog(): Promise<PosCatalog> {
        const since = new Date(Date.now() - PRESCRIPTION_WINDOW_DAYS * 86_400_000).toISOString();
        const [products, services, owners, prescriptions] = await Promise.all([
            this.supabase
                .from("products")
                .select("id,sku,name,kind,price,stock,requires_prescription,category:product_categories(name)")
                .eq("is_active", true)
                .in("kind", ["pet_shop", "farmacia"])
                .order("name")
                .limit(1000),
            this.supabase.from("services").select("id,name,base_price").eq("is_active", true).order("name"),
            this.supabase.from("owners").select("id,full_name,document_number").order("full_name").limit(1000),
            this.supabase
                .from("prescriptions")
                .select("id,created_at,patient:patients(name)")
                .gte("created_at", since)
                .order("created_at", { ascending: false })
                .limit(100),
        ]);

        const failed = products.error ?? services.error ?? owners.error ?? prescriptions.error;
        if (failed) throw new Response("No se pudo cargar el catálogo de venta.", { status: 500 });

        return {
            products: (products.data ?? []).map((p: any) => ({
                id: p.id, sku: p.sku, name: p.name, kind: p.kind, price: Number(p.price), stock: p.stock,
                requiresPrescription: p.requires_prescription, category: p.category?.name ?? null,
            })),
            services: (services.data ?? []).map((s: any) => ({ id: s.id, name: s.name, price: Number(s.base_price) })),
            owners: (owners.data ?? []).map((o: any) => ({ id: o.id, name: o.full_name, document: o.document_number })),
            prescriptions: (prescriptions.data ?? []).map((r: any) => ({
                id: r.id, createdAt: r.created_at, patientName: r.patient?.name ?? "Paciente",
            })),
        };
    }

    async getHistory(): Promise<SaleSummary[]> {
        const { data, error } = await this.supabase
            .from("sales")
            .select(
                "id,sale_number,channel,payment_method,status,total,created_at,void_reason," +
                "owner:owners(full_name),seller:profiles!sales_sold_by_fkey(full_name)," +
                "items:sale_items(description,quantity,unit_price,subtotal)",
            )
            .order("created_at", { ascending: false })
            .limit(HISTORY_LIMIT);
        if (error) throw new Response("No se pudo cargar el historial de ventas.", { status: 500 });

        return (data ?? []).map((s: any) => ({
            id: s.id, number: s.sale_number, channel: s.channel, paymentMethod: s.payment_method,
            status: s.status, total: Number(s.total), createdAt: s.created_at,
            ownerName: s.owner?.full_name ?? null, sellerName: s.seller?.full_name ?? null, voidReason: s.void_reason,
            items: (s.items ?? []).map((i: any) => ({
                description: i.description, quantity: i.quantity,
                unitPrice: Number(i.unit_price), subtotal: Number(i.subtotal),
            })),
        }));
    }

    /** El canal se deduce de lo que realmente se vende, nunca del navegador. */
    async resolveChannel(items: readonly CartItemInput[]): Promise<SaleChannel> {
        const productIds = items.flatMap((i) => (i.type === "product" ? [i.id] : []));
        if (productIds.length === 0) return "servicios";

        const { data, error } = await this.supabase.from("products").select("kind").in("id", productIds);
        if (error) throw new AppError("No se pudo validar los productos.");
        return (data ?? []).some((p: Pick<CatalogProduct, "kind">) => p.kind === "farmacia") ? "farmacia" : "pet_shop";
    }

    /** Datos del paciente y dueño que respaldan una receta (verificados en la base). */
    async findPrescriptionContext(id: string): Promise<{ patientId: string; ownerId: string } | null> {
        const { data } = await this.supabase
            .from("prescriptions")
            .select("patient:patients(id,owner_id)")
            .eq("id", id)
            .maybeSingle<{ patient: { id: string; owner_id: string } | null }>();
        return data?.patient ? { patientId: data.patient.id, ownerId: data.patient.owner_id } : null;
    }

    async register(input: CheckoutInput, channel: SaleChannel, context: { ownerId?: string; patientId?: string }) {
        const { data, error } = await this.supabase.rpc("register_sale", {
            p_channel: channel,
            p_payment_method: input.paymentMethod,
            p_owner_id: context.ownerId ?? null,
            p_patient_id: context.patientId ?? null,
            p_prescription_id: input.prescriptionId ?? null,
            p_notes: input.notes ?? null,
            p_items: input.items.map((i) =>
                i.type === "product"
                    ? { product_id: i.id, quantity: i.quantity }
                    : { service_id: i.id, quantity: i.quantity },
            ),
        });
        if (error) throw SaleRepository.toError(error);

        const { data: sale } = await this.supabase
            .from("sales").select("sale_number,total").eq("id", data as string).single<{ sale_number: number; total: number }>();
        return { number: sale?.sale_number ?? 0, total: Number(sale?.total ?? 0) };
    }

    async void(saleId: string, reason: string): Promise<void> {
        const { error } = await this.supabase.rpc("void_sale", { p_sale_id: saleId, p_reason: reason });
        if (error) throw SaleRepository.toError(error);
    }


    private static toError(error: PostgrestError): AppError {
        if (error.code === "42501") {
            return new ForbiddenError(error.message);
        }

        if (error.code === "P0002") {
            return new NotFoundError(error.message);
        }

        // Detectar específicamente el error de stock insuficiente.
        if (error.message.includes("products_stock_check")) {
            return new BadRequestError(
                "Stock insuficiente: actualiza la página para ver las existencias reales."
            );
        }

        if (BUSINESS_CODES.has(error.code)) {
            return new BadRequestError(error.message);
        }

        return new AppError(
            "No se pudo completar la operación. Intenta nuevamente."
        );
    }

}