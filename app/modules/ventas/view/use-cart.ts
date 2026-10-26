import { useCallback, useMemo, useReducer } from "react";

export interface CartLine {
    key: string;
    type: "product" | "service";
    id: string | number;
    name: string;
    unitPrice: number;
    quantity: number;
    maxQuantity: number;
    requiresPrescription: boolean;
}

export type NewCartLine = Omit<CartLine, "key" | "quantity">;

type Action =
    | { type: "add"; line: NewCartLine }
    | { type: "quantity"; key: string; quantity: number }
    | { type: "remove"; key: string }
    | { type: "clear" };

const MAX_PER_LINE = 999;
const clamp = (value: number, max: number) => Math.min(Math.max(Math.trunc(value) || 1, 1), max);

function reducer(lines: CartLine[], action: Action): CartLine[] {
    switch (action.type) {
        case "add": {
            const key = `${action.line.type}:${action.line.id}`;
            const maxQuantity = action.line.maxQuantity || MAX_PER_LINE;
            const existing = lines.find((line) => line.key === key);
            if (!existing) return [...lines, { ...action.line, maxQuantity, key, quantity: 1 }];
            return lines.map((line) =>
                line.key === key ? { ...line, quantity: clamp(line.quantity + 1, line.maxQuantity) } : line,
            );
        }
        case "quantity":
            return lines.map((line) =>
                line.key === action.key ? { ...line, quantity: clamp(action.quantity, line.maxQuantity) } : line,
            );
        case "remove":
            return lines.filter((line) => line.key !== action.key);
        case "clear":
            return [];
    }
}

export function useCart() {
    const [lines, dispatch] = useReducer(reducer, []);

    // Las acciones son estables: el catálogo no se vuelve a renderizar al agregar al carrito.
    const add = useCallback((line: NewCartLine) => dispatch({ type: "add", line }), []);
    const setQuantity = useCallback((key: string, quantity: number) => dispatch({ type: "quantity", key, quantity }), []);
    const remove = useCallback((key: string) => dispatch({ type: "remove", key }), []);
    const clear = useCallback(() => dispatch({ type: "clear" }), []);

    return useMemo(
        () => ({
            lines,
            total: lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
            count: lines.reduce((sum, line) => sum + line.quantity, 0),
            needsPrescription: lines.some((line) => line.requiresPrescription),
            add,
            setQuantity,
            remove,
            clear,
        }),
        [lines, add, setQuantity, remove, clear],
    );
}

export type Cart = ReturnType<typeof useCart>;