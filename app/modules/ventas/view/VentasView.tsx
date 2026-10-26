import { useEffect } from "react";
import { Link, useActionData } from "react-router";
import { useActionToast } from "~/core/feedback/use-action-toast";
import { cn } from "~/core/lib/cn";
import { PageHeader } from "~/core/ui/PageHeader";
import type { PosCatalog as Catalog, SaleSummary, VentasActionResult } from "../model/sale.types";
import { CartPanel } from "./CartPanel";
import { PosCatalog } from "./PosCatalog";
import { SalesHistory } from "./SalesHistory";
import { useCart } from "./use-cart";

interface VentasViewProps {
    view: "caja" | "historial";
    catalog: Catalog | null;
    history: SaleSummary[] | null;
    today: string;
    isAdmin: boolean;
}

const TABS = [
    { view: "caja", label: "Caja", to: "/ventas" },
    { view: "historial", label: "Historial de ventas", to: "/ventas?vista=historial" },
] as const;

export function VentasView({ view, catalog, history, today, isAdmin }: VentasViewProps) {
    const actionData = useActionData<VentasActionResult>();
    const cart = useCart();
    useActionToast(actionData);

    const { clear } = cart;
    useEffect(() => {
        if (actionData?.ok && actionData.saleNumber) clear();
    }, [actionData, clear]);

    return (
        <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
            <PageHeader
                eyebrow="Pet Shop · Farmacia · Servicios"
                title="Ventas y caja"
                description="Registra ventas de productos y servicios. El stock se descuenta automáticamente y cada venta queda auditada."
            />

            <nav aria-label="Secciones de ventas" className="flex gap-1 border-b border-line">
                {TABS.map((tab) => (
                    <Link
                        key={tab.view}
                        to={tab.to}
                        aria-current={view === tab.view ? "page" : undefined}
                        className={cn(
                            "-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                            view === tab.view ? "border-brand text-brand-text" : "border-transparent text-ink-muted hover:text-ink",
                        )}
                    >
                        {tab.label}
                    </Link>
                ))}
            </nav>

            {view === "caja" && catalog && (
                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
                    <PosCatalog catalog={catalog} onAdd={cart.add} />
                    <CartPanel cart={cart} catalog={catalog} isAdmin={isAdmin} />
                </div>
            )}
            {view === "historial" && history && <SalesHistory sales={history} today={today} isAdmin={isAdmin} />}
        </section>
    );
}