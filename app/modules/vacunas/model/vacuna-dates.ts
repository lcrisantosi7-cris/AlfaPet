export const limaToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });

export const addDays = (isoDate: string, days: number) => {
    const d = new Date(isoDate + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
};