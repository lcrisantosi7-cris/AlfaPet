import { useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Anima un número desde su valor anterior hasta `target`. Respeta prefers-reduced-motion. */
export function useCountUp(target: number, duration = 900) {
    const [value, setValue] = useState(target);
    const previous = useRef(0);

    useIsoLayoutEffect(() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const from = previous.current;
        previous.current = target;
        if (reduced || from === target) {
            setValue(target);
            return;
        }

        const start = performance.now();
        let frame = 0;
        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(from + (target - from) * eased);
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        setValue(from);
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [target, duration]);

    return value;
}