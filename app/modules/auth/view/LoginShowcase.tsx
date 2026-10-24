import { Cake, CalendarCheck, Package, PawPrint, ShieldCheck, Stethoscope, Syringe, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { LOGO_SRC } from "~/core/layout/BrandLogo";
import { SmartImage } from "~/core/ui/SmartImage";

export const LOGIN_PHOTO_SRC = "/images/hero/login-pet.jpg";

interface DayEvent {
    icon: LucideIcon;
    tone: string;
    title: string;
    detail: string;
}

const EVENTS: readonly DayEvent[] = [
    { icon: Syringe, tone: "bg-[#cdefdf] text-[#137a4b]", title: "Luna recibió su vacuna", detail: "Antirrábica · hace 2 min" },
    { icon: CalendarCheck, tone: "bg-[#d6e8ff] text-[#2260c2]", title: "Cita confirmada", detail: "Max · hoy 10:30" },
    { icon: Package, tone: "bg-[#ffe9b8] text-[#8a5a00]", title: "Stock bajo", detail: "Antipulgas · quedan 8" },
    { icon: Stethoscope, tone: "bg-[#ffe0c2] text-[#b94f00]", title: "Consulta completada", detail: "Michi · control general" },
    { icon: Cake, tone: "bg-[#e8d5ff] text-[#7436c8]", title: "¡Toby cumple 3 años!", detail: "Avísale a su familia" },
];

export function LoginShowcase() {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const id = setInterval(() => setTick((value) => value + 1), 3400);
        return () => clearInterval(id);
    }, []);

    const total = EVENTS.length;
    const visible = [0, 1, 2].map((i) => EVENTS[(((tick - i) % total) + total) % total]);

    return (
        <section className="login-brand-panel relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-12">
            <SmartImage src={LOGIN_PHOTO_SRC} alt="" loading="eager" className="absolute inset-0 size-full object-cover" fallback={null} />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#1c0d05] via-[#2b1409]/70 to-[#3b1d0e]/35" />
            <div aria-hidden className="login-panel-pattern" />

            <div className="relative z-10 flex items-center gap-3">
                <div className="flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/10">
                    <SmartImage src={LOGO_SRC} alt="" loading="eager" className="size-11 object-cover" fallback={<PawPrint className="size-7 text-brand" aria-hidden />} />
                </div>
                <div>
                    <p className="text-lg font-extrabold tracking-tight">AlfaPet</p>
                    <p className="text-xs font-medium text-white/70">Clínica veterinaria</p>
                </div>
            </div>

            <div aria-hidden className="login-float relative z-10 ml-auto w-full max-w-xs">
                <p className="mb-3 text-right text-[0.65rem] font-bold tracking-[0.18em] text-white/60 uppercase">Un día en AlfaPet</p>
                <ul className="flex flex-col gap-2.5">
                    {visible.map((event, index) => {
                        const Icon = event.icon;
                        return (
                            <li
                                key={event.title}
                                className="transition-[opacity,scale] duration-500"
                                style={{ opacity: 1 - index * 0.3, scale: String(1 - index * 0.03) }}
                            >
                                <div className="login-chip flex items-center gap-3 rounded-2xl bg-white/95 p-3 text-[#3b1d0e] shadow-xl shadow-black/20">
                                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${event.tone}`}>
                                        <Icon className="size-5" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-bold">{event.title}</span>
                                        <span className="block truncate text-xs text-[#85705f]">{event.detail}</span>
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <div className="relative z-10">
                <h1 className="max-w-md text-4xl leading-[1.1] font-extrabold tracking-tight xl:text-5xl">
                    Aquí cada patita <span className="text-[#ffd3a3]">cuenta.</span>
                </h1>
                <p className="mt-4 max-w-sm text-sm leading-7 text-white/75">
                    Agenda, historiales, vacunas y stock de la clínica, todo en un mismo lugar.
                </p>
                <div className="mt-8 flex items-end justify-between gap-4">
                    <p className="flex items-center gap-2 text-xs text-white/60">
                        <ShieldCheck className="size-4" aria-hidden /> Acceso protegido para el personal autorizado
                    </p>
                    <div aria-hidden className="flex gap-3 text-white">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <PawPrint key={i} className="login-paw-step size-5 rotate-90" style={{ translate: `0 ${i % 2 ? "-6px" : "6px"}` }} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}