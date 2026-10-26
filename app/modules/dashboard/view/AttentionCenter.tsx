import { ChevronRight, FileWarning, FlaskConical, PackageX, ShieldCheck, Syringe, TriangleAlert, type LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { cn } from "~/core/lib/cn";
import { SectionCard } from "~/core/ui/SectionCard";
import type { AttentionItem, AttentionType } from "../model/admin-overview.types";

const ICON: Record<AttentionType, LucideIcon> = {
    stock: PackageX,
    surgery_consent: FileWarning,
    vaccine_overdue: Syringe,
    lab_pending: FlaskConical,
};

export function AttentionCenter({ items }: { items: readonly AttentionItem[] }) {
    const urgent = items.filter((item) => item.severity === "high").length;

    return (
        <SectionCard
            title="Requiere atención"
            icon={TriangleAlert}
            action={
                items.length > 0 ? (
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold tabular-nums", urgent > 0 ? "bg-tone-red-soft text-tone-red-fg" : "bg-tone-amber-soft text-tone-amber-fg")}>
                        {items.length}
                    </span>
                ) : null
            }
        >
            {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                    <span className="ui-pop flex size-12 items-center justify-center rounded-full bg-tone-green-icon text-tone-green-fg">
                        <ShieldCheck aria-hidden className="size-6" />
                    </span>
                    <p className="font-bold">Todo en orden</p>
                    <p className="max-w-xs text-sm text-ink-muted">No hay stock crítico, vacunas vencidas ni cirugías sin consentimiento.</p>
                </div>
            ) : (
                <ul className="-mx-1 flex flex-col gap-1.5">
                    {items.map((item, index) => {
                        const Icon = ICON[item.type];
                        return (
                            <li key={`${item.type}:${item.title}:${index}`}>
                                <Link
                                    to={item.href}
                                    className={cn("agenda-row group flex items-center gap-3 rounded-xl border border-line bg-bg px-3 py-2.5", item.severity === "high" ? "alert-high" : "alert-medium")}
                                >
                                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", item.severity === "high" ? "bg-tone-red-soft text-tone-red-fg" : "bg-tone-amber-soft text-tone-amber-fg")}>
                                        <Icon aria-hidden className="size-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold">{item.title}</span>
                                        <span className="block truncate text-xs text-ink-muted">{item.detail}</span>
                                    </span>
                                    <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </SectionCard>
    );
}