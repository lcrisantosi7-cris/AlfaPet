export type SaleChannel = "pet_shop" | "farmacia" | "servicios";
export type PaymentMethod = "efectivo" | "yape" | "plin" | "tarjeta" | "transferencia";
export type SaleStatus = "pagada" | "anulada";

export interface CatalogProduct {
    id: string;
    sku: string;
    name: string;
    kind: "pet_shop" | "farmacia";
    price: number;
    stock: number;
    requiresPrescription: boolean;
    category: string | null;
}

export interface CatalogService {
    id: number;
    name: string;
    price: number;
}

export interface OwnerOption {
    id: string;
    name: string;
    document: string | null;
}

export interface PrescriptionOption {
    id: string;
    createdAt: string;
    patientName: string;
}

export interface SaleLine {
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface SaleSummary {
    id: string;
    number: number;
    channel: SaleChannel;
    paymentMethod: PaymentMethod;
    status: SaleStatus;
    total: number;
    createdAt: string;
    ownerName: string | null;
    sellerName: string | null;
    voidReason: string | null;
    items: SaleLine[];
}

export interface PosCatalog {
    products: CatalogProduct[];
    services: CatalogService[];
    owners: OwnerOption[];
    prescriptions: PrescriptionOption[];
}

export type VentasActionResult = {
    ok: boolean;
    message: string;
    saleNumber?: number;
};