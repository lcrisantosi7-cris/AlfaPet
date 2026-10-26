import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import { Modal } from "~/core/ui/Modal";
import type { CategoryOption, ProductoActionResult } from "../model/producto.types";
import { ProductFields } from "./ProductFields";

export function ProductDialog({ categories }: { categories: CategoryOption[] }) {
    const result = useActionData() as ProductoActionResult | undefined;
    const busy = useNavigation().state !== "idle";
    const [open, setOpen] = useState(false);
    useEffect(() => { if (result?.ok && result.intent === "create") setOpen(false); }, [result]);

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className="ui-button inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-on-brand shadow-md shadow-brand/30 hover:opacity-90">
                <Plus className="size-5" aria-hidden />Registrar producto
            </button>
            <Modal open={open} onClose={() => setOpen(false)} title="Registrar producto">
                {open && (
                    <Form method="post" className="flex flex-col gap-5">
                        <input type="hidden" name="intent" value="create" />
                        <ProductFields categories={categories} withStock errors={result && !result.ok && result.intent === "create" ? result.fieldErrors : undefined} />
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setOpen(false)} className="ui-button h-11 rounded-xl border border-line px-5 text-sm font-semibold hover:bg-surface-muted">Cancelar</button>
                            <button type="submit" disabled={busy} className="ui-button h-11 rounded-xl bg-brand px-6 text-sm font-bold text-on-brand disabled:opacity-60">{busy ? "Guardando…" : "Guardar producto"}</button>
                        </div>
                    </Form>
                )}
            </Modal>
        </>
    );
}