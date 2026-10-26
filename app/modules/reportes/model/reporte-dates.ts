export const limaToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
export const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Lima" });

export const addDays = (d: string, n: number) => {
    const x = new Date(d + "T00:00:00Z");
    x.setUTCDate(x.getUTCDate() + n);
    return x.toISOString().slice(0, 10);
};
export const diffDays = (a: string, b: string) => Math.round((+new Date(b + "T00:00:00Z") - +new Date(a + "T00:00:00Z")) / 86400000);

export type BucketMode = "day" | "week" | "month";

const mondayOf = (d: string) => {
    const x = new Date(d + "T00:00:00Z");
    x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
    return x.toISOString().slice(0, 10);
};
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Agrupa por día (≤45 días), semana (≤140) o mes, para que el gráfico siempre sea legible. */
export function buildBuckets(from: string, to: string) {
    const span = diffDays(from, to) + 1;
    const mode: BucketMode = span <= 45 ? "day" : span <= 140 ? "week" : "month";
    const keyOf = (date: string) => (mode === "day" ? date : mode === "week" ? mondayOf(date) : date.slice(0, 7));
    const keys: string[] = [];
    for (let d = from; d <= to; d = addDays(d, 1)) {
        const k = keyOf(d);
        if (keys[keys.length - 1] !== k) keys.push(k);
    }
    const labels = keys.map((k) => (mode === "month" ? `${MONTHS[Number(k.slice(5, 7)) - 1]} ${k.slice(2, 4)}` : `${k.slice(8)}/${k.slice(5, 7)}`));
    const index = new Map(keys.map((k, i) => [k, i]));
    const bump = (arr: number[], iso: string, value = 1) => {
        const i = index.get(keyOf(dayKey(iso)));
        if (i !== undefined) arr[i] = (arr[i] ?? 0) + value;
    };
    return { labels, size: keys.length, bump, mode };
}
