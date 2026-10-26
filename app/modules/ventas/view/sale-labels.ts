import type { PaymentMethod, SaleChannel } from "../model/sale.types";

export const CHANNEL_LABEL: Record<SaleChannel, string> = {
    pet_shop: "Pet Shop",
    farmacia: "Farmacia",
    servicios: "Servicios",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
    efectivo: "Efectivo",
    yape: "Yape",
    plin: "Plin",
    tarjeta: "Tarjeta",
    transferencia: "Transferencia",
};

export const PAYMENT_METHODS = Object.keys(PAYMENT_LABEL) as PaymentMethod[];

/** 42 → "#00042" */
export const saleNumber = (value: number) => `#${String(value).padStart(5, "0")}`;

const dateTime = new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Lima",
});

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));