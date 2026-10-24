import { useEffect, useRef, useState } from "react";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Número que "sube" hasta su valor. Respeta prefers-reduced-motion. */
export function CountUp({ value, duration = 900, className }: { value: number; duration?: number; className?: string }) {
    const [display, setDisplay] = useState(value);
    const from = useRef(0);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setDisplay(value);
            from.current = value;
            return;
        }
        const start = from.current;
        const t0 = performance.now();
        let raf = 0;
        const tick = (now: number) => {
            const progress = Math.min((now - t0) / duration, 1);
            const current = Math.round(start + (value - start) * easeOutCubic(progress));
            setDisplay(current);
            from.current = current;
            if (progress < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value, duration]);

    return (
        <>
            <span aria-hidden className={className}>{display}</span>
            <span className="sr-only">{value}</span>
        </>
    );
}