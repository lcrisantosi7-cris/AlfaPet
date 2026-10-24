import { useEffect, useRef } from "react";

export type DogMood = "idle" | "cover" | "peek" | "error" | "loading";

interface LoginMascotProps {
    mood: DogMood;
    lookAt?: { x: number; y: number } | null;
}

const MAX_OFFSET = 5;

export function LoginMascot({ mood, lookAt }: LoginMascotProps) {
    const ref = useRef<SVGSVGElement>(null);
    const lookX = lookAt?.x;
    const lookY = lookAt?.y;

    useEffect(() => {
        const svg = ref.current;
        if (!svg) return;
        const set = (x: number, y: number) => {
            svg.style.setProperty("--px", `${x * MAX_OFFSET}px`);
            svg.style.setProperty("--py", `${y * MAX_OFFSET}px`);
        };

        if (lookX !== undefined && lookY !== undefined) {
            set(lookX, lookY);
            return;
        }
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            set(0, 0);
            return;
        }

        const onMove = (event: PointerEvent) => {
            const rect = svg.getBoundingClientRect();
            const dx = event.clientX - (rect.left + rect.width / 2);
            const dy = event.clientY - (rect.top + rect.height * 0.55);
            const dist = Math.hypot(dx, dy) || 1;
            const strength = Math.min(dist / 160, 1);
            set((dx / dist) * strength, (dy / dist) * strength);
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
    }, [lookX, lookY]);

    return (
        <svg
            ref={ref}
            viewBox="0 0 200 130"
            aria-hidden
            focusable="false"
            data-mood={mood}
            className="dog mx-auto block h-auto w-44 sm:w-48"
        >
            <g className="dog-head">
                <g transform="rotate(14 46 64)">
                    <ellipse className="dog-ear dog-ear-left" cx="46" cy="64" rx="19" ry="36" fill="#8a4a1f" />
                </g>
                <g transform="rotate(-14 154 64)">
                    <ellipse className="dog-ear dog-ear-right" cx="154" cy="64" rx="19" ry="36" fill="#8a4a1f" />
                </g>
                <ellipse cx="100" cy="80" rx="56" ry="54" fill="#f2b176" />
                <ellipse cx="100" cy="52" rx="16" ry="24" fill="#ffe7c9" />
                <ellipse cx="100" cy="106" rx="28" ry="22" fill="#ffe7c9" />
                <ellipse className="dog-tongue" cx="100" cy="115" rx="7" ry="9" fill="#f26b7d" />
                <ellipse cx="100" cy="95" rx="9" ry="6.5" fill="#2b1408" />
                <path d="M100 101v7M88 109c4 6 20 6 24 0" stroke="#2b1408" strokeWidth="2.4" strokeLinecap="round" fill="none" />

                <g className="dog-eye">
                    <circle cx="76" cy="74" r="12.5" fill="#fff" />
                    <g className="dog-pupil">
                        <circle cx="76" cy="74" r="6.5" fill="#2b1408" />
                        <circle cx="78.5" cy="71.5" r="2" fill="#fff" />
                    </g>
                </g>
                <g className="dog-eye">
                    <circle cx="124" cy="74" r="12.5" fill="#fff" />
                    <g className="dog-pupil">
                        <circle cx="124" cy="74" r="6.5" fill="#2b1408" />
                        <circle cx="126.5" cy="71.5" r="2" fill="#fff" />
                    </g>
                </g>
            </g>

            <g className="dog-paw dog-paw-left">
                <ellipse cx="76" cy="78" rx="19" ry="16" fill="#ffd9a8" stroke="#8a4a1f" strokeWidth="2" />
                <circle cx="76" cy="82" r="5" fill="#8a4a1f" opacity=".35" />
            </g>
            <g className="dog-paw dog-paw-right">
                <ellipse cx="124" cy="78" rx="19" ry="16" fill="#ffd9a8" stroke="#8a4a1f" strokeWidth="2" />
                <circle cx="124" cy="82" r="5" fill="#8a4a1f" opacity=".35" />
            </g>
        </svg>
    );
}