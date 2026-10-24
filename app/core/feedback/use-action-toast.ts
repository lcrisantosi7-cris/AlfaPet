import { useEffect, useRef } from "react";
import { toast } from "./toast-store";

type ActionResult = { ok?: boolean; message?: string } | null | undefined;

/** Dispara un aviso una sola vez por cada respuesta de action/fetcher. */
export function useActionToast(result: ActionResult) {
    const last = useRef<ActionResult>(null);

    useEffect(() => {
        if (!result?.message || last.current === result) return;
        last.current = result;
        if (result.ok) toast.success("¡Listo!", result.message);
        else toast.warning("Revisa esto", result.message);
    }, [result]);
}