const TIME_ZONE = "America/Lima";

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });
const shortDayFormat = new Intl.DateTimeFormat("es-PE", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
});
const timeFormat = new Intl.DateTimeFormat("es-PE", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
});

const DAY_MS = 86_400_000;

export class LimaTime {
    /** "2026-10-22" en hora de Lima. */
    static dayKey(date: Date): string {
        return dayKeyFormat.format(date);
    }

    /** "Hoy - 09:30 a.m." | "Mañana - 02:00 p.m." | "25/10 - 10:00 a.m." */
    static scheduleLabel(startsAt: string, now = new Date()): string {
        const date = new Date(startsAt);
        const key = LimaTime.dayKey(date);

        const day =
            key === LimaTime.dayKey(now)
                ? "Hoy"
                : key === LimaTime.dayKey(new Date(now.getTime() + DAY_MS))
                    ? "Mañana"
                    : shortDayFormat.format(date);

        const time = timeFormat
            .format(date)
            .replace(/\s/g, " ")
            .replace("a. m.", "a.m.")
            .replace("p. m.", "p.m.");

        return `${day} - ${time}`;
    }
}