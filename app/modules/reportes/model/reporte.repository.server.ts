import type { SupabaseServerClient } from "~/core/supabase/client.server";
import { addDays, buildBuckets, diffDays, limaToday } from "./reporte-dates";
import type { Datum, ReportAlert, ReporteData } from "./reporte.types";

const CHANNEL: Record<string, string> = { pet_shop: "Pet Shop", farmacia: "Farmacia", servicios: "Servicios" };
const PAYMENT: Record<string, string> = { efectivo: "Efectivo", yape: "Yape", plin: "Plin", tarjeta: "Tarjeta", transferencia: "Transferencia" };
const APPT: Record<string, string> = { pendiente: "Pendiente", confirmada: "Confirmada", completada: "Atendida", cancelada: "Cancelada" };
const KIND: Record<string, string> = { pet_shop: "Pet Shop", farmacia: "Farmacia", insumo: "Insumos" };

const one = (v: any) => (Array.isArray(v) ? v[0] : v);
const title = (v: string) => v.replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
const add = (m: Map<string, number>, k: string, v = 1) => m.set(k, (m.get(k) ?? 0) + v);
const top = (m: Map<string, number>, n = 8): Datum[] => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, value]) => ({ label, value }));
const all = (m: Map<string, number>): Datum[] => [...m.entries()].map(([label, value]) => ({ label, value }));
const pctChange = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);
const names = (list: { name: string }[]) => list.slice(0, 3).map((p) => p.name).join(", ") + (list.length > 3 ? "…" : "");

export class ReporteRepository {
    constructor(private readonly sb: SupabaseServerClient) { }

    /** Lee todas las páginas (Supabase limita a 1000 filas por consulta). */
    private async rows(make: (a: number, b: number) => PromiseLike<{ data: any[] | null; error: unknown }>): Promise<any[]> {
        const out: any[] = [];
        for (let page = 0; page < 6; page++) {
            const { data, error } = await make(page * 1000, page * 1000 + 999);
            if (error) throw new Response("No se pudieron cargar los reportes.", { status: 500 });
            out.push(...(data ?? []));
            if ((data?.length ?? 0) < 1000) break;
        }
        return out;
    }

    async build(from: string, to: string, preset: number | null): Promise<ReporteData> {
        const days = diffDays(from, to) + 1;
        const prevFrom = addDays(from, -days), prevTo = addDays(from, -1);
        const bounds = (a: string, b: string) => [`${a}T00:00:00-05:00`, `${b}T23:59:59.999-05:00`] as const;
        const [f1, t1] = bounds(from, to), [f0, t0] = bounds(prevFrom, prevTo);
        const today = limaToday();
        const [fToday, tToday] = bounds(today, today);
        const nowIso = new Date().toISOString();
        const sb = this.sb;
        const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);

        const [sales, prevSales, appts, consults, patients, vaccs, products, occupied, capacity, apptPrev, overdueAppts, todayAppts, upcomingSurg] = await Promise.all([
            this.rows((a, b) => sb.from("sales").select("channel,payment_method,status,total,created_at,items:sale_items(description,subtotal)").gte("created_at", f1).lte("created_at", t1).order("created_at").range(a, b)),
            this.rows((a, b) => sb.from("sales").select("status,total").gte("created_at", f0).lte("created_at", t0).order("created_at").range(a, b)),
            this.rows((a, b) => sb.from("appointments").select("status,starts_at,care_type:care_types(label)").gte("starts_at", f1).lte("starts_at", t1).order("starts_at").range(a, b)),
            this.rows((a, b) => sb.from("consultations").select("created_at,vet:profiles!consultations_vet_id_fkey(full_name)").gte("created_at", f1).lte("created_at", t1).order("created_at").range(a, b)),
            this.rows((a, b) => sb.from("patients").select("species,created_at,is_active,life_status").order("created_at").range(a, b)),
            this.rows((a, b) => sb.from("vaccinations").select("due_date,applied_at").order("created_at").range(a, b)),
            this.rows((a, b) => sb.from("products").select("name,kind,stock,min_stock,price,is_active,expires_at").order("created_at").range(a, b)),
            count(sb.from("admissions").select("id", { count: "exact", head: true }).eq("status", "internado")),
            count(sb.from("kennels").select("id", { count: "exact", head: true }).eq("is_active", true)),
            count(sb.from("appointments").select("id", { count: "exact", head: true }).gte("starts_at", f0).lte("starts_at", t0)),
            count(sb.from("appointments").select("id", { count: "exact", head: true }).in("status", ["pendiente", "confirmada"]).lt("starts_at", nowIso)),
            count(sb.from("appointments").select("id", { count: "exact", head: true }).in("status", ["pendiente", "confirmada"]).gte("starts_at", fToday).lte("starts_at", tToday)),
            count(sb.from("surgeries").select("id", { count: "exact", head: true }).eq("status", "programada").gte("scheduled_at", nowIso)),
        ]);

        const bk = buildBuckets(from, to);
        const zeros = () => Array.from({ length: bk.size }, () => 0);
        const revenueSeries = zeros(), apptSeries = zeros(), consSeries = zeros();

        // Ventas
        let revenue = 0, paid = 0, voided = 0;
        const channel = new Map<string, number>(), payment = new Map<string, number>(), items = new Map<string, number>();
        for (const s of sales) {
            if (s.status !== "pagada") { voided++; continue; }
            const t = Number(s.total);
            revenue += t; paid++;
            bk.bump(revenueSeries, s.created_at, t);
            add(channel, CHANNEL[s.channel] ?? s.channel, t);
            add(payment, PAYMENT[s.payment_method] ?? s.payment_method, t);
            for (const it of s.items ?? []) add(items, it.description, Number(it.subtotal));
        }
        const prevPaid = prevSales.filter((s) => s.status === "pagada");
        const revenuePrev = prevPaid.reduce((sum, s) => sum + Number(s.total), 0);

        // Citas y consultas
        const status = new Map<string, number>(), care = new Map<string, number>(), vets = new Map<string, number>();
        for (const a of appts) {
            bk.bump(apptSeries, a.starts_at);
            add(status, APPT[a.status] ?? a.status);
            add(care, one(a.care_type)?.label ?? "Sin tipo");
        }
        for (const c of consults) {
            bk.bump(consSeries, c.created_at);
            add(vets, one(c.vet)?.full_name ?? "Sin asignar");
        }

        // Pacientes
        const species = new Map<string, number>();
        let activos = 0, inactivos = 0, fallecidos = 0, newPatients = 0;
        for (const p of patients) {
            if (p.life_status === "fallecido") { fallecidos++; continue; }
            p.is_active ? activos++ : inactivos++;
            add(species, title(String(p.species ?? "otro")));
            if (p.created_at >= f1 && p.created_at <= t1) newPatients++;
        }

        // Vacunas
        let vApplied = 0, vPending = 0, vOverdue = 0, vInRange = 0;
        for (const v of vaccs) {
            if (v.applied_at) { vApplied++; if (v.applied_at >= from && v.applied_at <= to) vInRange++; }
            else if (v.due_date < today) vOverdue++;
            else vPending++;
        }

        // Inventario
        const active = products.filter((p) => p.is_active);
        const outList = active.filter((p) => Number(p.stock) <= 0).map((p) => ({ name: p.name as string }));
        const lowList = active.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= Number(p.min_stock)).map((p) => ({ name: p.name as string }));
        const expList = active.filter((p) => p.expires_at && p.expires_at >= today && p.expires_at <= addDays(today, 30) && Number(p.stock) > 0).map((p) => ({ name: p.name as string }));
        const kindMap = new Map<string, number>();
        for (const p of active) add(kindMap, KIND[p.kind] ?? p.kind);
        const invValue = active.reduce((s, p) => s + Number(p.price) * Number(p.stock), 0);

        // Alertas y resumen de la clínica
        const alerts: ReportAlert[] = [];
        if (outList.length) alerts.push({ level: "danger", title: `${outList.length} producto(s) agotado(s)`, detail: names(outList), href: "/productos" });
        if (lowList.length) alerts.push({ level: "warning", title: `Stock bajo en ${lowList.length} producto(s)`, detail: names(lowList), href: "/productos" });
        if (expList.length) alerts.push({ level: "warning", title: `${expList.length} producto(s) vencen en 30 días`, detail: names(expList), href: "/productos" });
        if (overdueAppts) alerts.push({ level: "warning", title: `${overdueAppts} cita(s) con fecha expirada sin atender`, detail: "Reprograma o cancélalas para limpiar la agenda.", href: "/citas" });
        if (vOverdue) alerts.push({ level: "warning", title: `${vOverdue} vacuna(s) vencida(s)`, detail: "Contacta a los dueños para agendar la dosis.", href: "/vacunas" });
        if (capacity > 0 && occupied / capacity >= 0.8) alerts.push({ level: "warning", title: `Internamiento al ${Math.round((occupied / capacity) * 100)}% de capacidad`, detail: `${occupied} de ${capacity} habitaciones ocupadas.`, href: "/internamiento" });
        const delta = pctChange(revenue, revenuePrev);
        if (delta !== null && delta <= -20) alerts.push({ level: "warning", title: `Ingresos ${Math.abs(Math.round(delta))}% por debajo del periodo anterior`, detail: "Revisa campañas, stock de productos de alta rotación y tarifas." });
        if (delta !== null && delta >= 10) alerts.push({ level: "success", title: `Ingresos ${Math.round(delta)}% por encima del periodo anterior`, detail: "Buen ritmo: mantén el stock de los productos más vendidos." });
        if (todayAppts) alerts.push({ level: "info", title: `${todayAppts} cita(s) programadas para hoy`, detail: "Revisa la agenda del día.", href: "/citas" });
        if (upcomingSurg) alerts.push({ level: "info", title: `${upcomingSurg} cirugía(s) programada(s)`, detail: "Confirma consentimiento y ayuno con anticipación.", href: "/cirugias" });
        if (voided) alerts.push({ level: "info", title: `${voided} venta(s) anulada(s) en el periodo`, detail: "Revisa los motivos en el historial de ventas.", href: "/ventas?vista=historial" });
        if (!alerts.length) alerts.push({ level: "success", title: "Sin alertas", detail: "Todo está en orden en la clínica." });

        return {
            range: { from, to, days, preset, bucket: bk.mode },
            labels: bk.labels,
            kpis: {
                revenue, revenuePrev, sales: paid, salesPrev: prevPaid.length, avgTicket: paid ? revenue / paid : 0, voided,
                appointments: appts.length, appointmentsPrev: apptPrev, consultations: consults.length, newPatients, vaccinesApplied: vInRange,
                occupied, capacity,
            },
            revenueSeries, appointmentsSeries: apptSeries, consultationsSeries: consSeries,
            byChannel: all(channel), byPayment: top(payment), topItems: top(items),
            apptStatus: all(status), careTypes: top(care), byVet: top(vets),
            species: top(species, 6),
            patientStatus: [{ label: "Activos", value: activos }, { label: "Inactivos", value: inactivos }, { label: "Fallecidos", value: fallecidos }],
            inventoryByKind: all(kindMap),
            vaccination: [{ label: "Aplicadas", value: vApplied }, { label: "Pendientes", value: vPending }, { label: "Vencidas", value: vOverdue }],
            inventory: { value: invValue, products: active.length, low: lowList.length, out: outList.length, expiring: expList.length },
            alerts,
        };
    }
}