import { PawPrint, Search, Skull, UserCheck, UserRound, Users, Weight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Badge } from "~/core/ui/Badge";
import { PageHeader } from "~/core/ui/PageHeader";
import type { OwnerOption, PatientListRow, PatientOptions } from "../model/patient.types";
import { NewPatientDialog } from "./NewPatientDialog";
import { ageLabel, patientState, speciesLabel } from "./patient-labels";

type Status = "activos" | "inactivos" | "fallecidos" | "todos";
const CHIPS: { key: Status; label: string }[] = [
  { key: "activos", label: "Activos" }, { key: "inactivos", label: "Inactivos" },
  { key: "fallecidos", label: "Fallecidos" }, { key: "todos", label: "Todos" },
];

export function PacientesView({ patients, options, userRole }: { patients: PatientListRow[]; options: PatientOptions; userRole: string }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState("todos");
  const [status, setStatus] = useState<Status>("activos");
  const canCreate = userRole === "admin" || userRole === "recepcion";

  const owners = useMemo<OwnerOption[]>(() => {
    const map = new Map<string, OwnerOption>();
    for (const p of patients) {
      if (!p.ownerId) continue;
      const cur = map.get(p.ownerId);
      if (cur) cur.petCount++;
      else map.set(p.ownerId, { id: p.ownerId, name: p.ownerName ?? "Sin nombre", phone: p.ownerPhone, document: p.ownerDocument, petCount: 1 });
    }
    return [...map.values()];
  }, [patients]);

  const counts = useMemo(() => ({
    total: patients.length,
    activos: patients.filter((p) => p.isActive).length,
    fallecidos: patients.filter((p) => p.lifeStatus === "fallecido").length,
    duenos: owners.length,
  }), [patients, owners]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("es");
    return patients.filter((p) => {
      const dead = p.lifeStatus === "fallecido";
      const okStatus = status === "todos" || (status === "activos" ? p.isActive : status === "fallecidos" ? dead : !p.isActive && !dead);
      const okSpecies = species === "todos" || p.species === species;
      const okQuery = !q || [p.name, p.ownerName, p.ownerPhone, p.ownerDocument, p.microchip, p.breed].some((v) => v?.toLocaleLowerCase("es").includes(q));
      return okStatus && okSpecies && okQuery;
    });
  }, [patients, query, species, status]);

  const kpis = [
    { label: "Pacientes", value: counts.total, icon: PawPrint, tone: "bg-tone-orange-icon text-tone-orange-fg" },
    { label: "Activos", value: counts.activos, icon: UserCheck, tone: "bg-tone-green-icon text-tone-green-fg" },
    { label: "Dueños", value: counts.duenos, icon: Users, tone: "bg-tone-blue-icon text-tone-blue-fg" },
    { label: "Fallecidos", value: counts.fallecidos, icon: Skull, tone: "bg-tone-purple-icon text-tone-purple-fg" },
  ];

  return (
    <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
      <PageHeader
        eyebrow="Gestión asistencial"
        title="Pacientes"
        description="Haz clic en un paciente para ver su ficha completa, editarla o agregar otra mascota a su dueño."
        action={canCreate ? <NewPatientDialog options={options} owners={owners} /> : null}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="ui-card flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
            <span className={`flex size-12 items-center justify-center rounded-xl ${tone}`}><Icon className="size-6" aria-hidden /></span>
            <div><p className="text-2xl font-extrabold leading-none">{value}</p><p className="mt-1 text-xs text-ink-muted">{label}</p></div>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-surface shadow-card">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
            <span className="sr-only">Buscar</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar mascota, dueño, DNI, teléfono o microchip…" className="ui-field h-11 w-full rounded-xl border border-line bg-bg pl-10 pr-3 text-sm" />
          </label>
          <select aria-label="Especie" value={species} onChange={(e) => setSpecies(e.target.value)} className="ui-field h-11 rounded-xl border border-line bg-bg px-3 text-sm">
            <option value="todos">Todas las especies</option>
            {options.species.map((s) => <option key={s} value={s}>{speciesLabel(s)}</option>)}
          </select>
          <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
            {CHIPS.map((c) => (
              <button key={c.key} type="button" onClick={() => setStatus(c.key)} className={`ui-button h-9 rounded-lg px-3 text-xs font-semibold ${status === c.key ? "bg-brand text-on-brand shadow-sm" : "text-ink-muted hover:text-ink"}`}>{c.label}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-text"><PawPrint className="size-7" /></span>
            <h2 className="mt-4 text-lg font-bold">{patients.length === 0 ? "Todavía no hay pacientes" : "No encontramos coincidencias"}</h2>
            <p className="mt-1 max-w-md text-sm text-ink-muted">Prueba con otro nombre, DNI, teléfono o filtro.</p>
          </div>
        ) : (
          <div className="ui-table-wrap">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink-muted">
                <tr><th className="px-5 py-4 font-semibold">Paciente</th><th className="px-5 py-4 font-semibold">Dueño</th><th className="px-5 py-4 font-semibold">Peso actual</th><th className="px-5 py-4 font-semibold">Estado</th><th className="px-5 py-4 text-right font-semibold">Detalle</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((p) => {
                  const s = patientState(p);
                  return (
                    <tr key={p.id} onClick={() => navigate(`/pacientes/${p.id}`)} className="cursor-pointer transition-colors hover:bg-brand-soft/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text"><PawPrint className="size-5" /></span>
                          <div><p className="font-bold">{p.name}</p><p className="text-xs text-ink-muted">{speciesLabel(p.species)}{p.breed ? ` · ${p.breed}` : ""} · {ageLabel(p.birthDate)}</p></div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><div className="flex items-start gap-2"><UserRound className="mt-0.5 size-4 text-ink-muted" /><div><p className="font-medium">{p.ownerName ?? "—"}</p><p className="text-xs text-ink-muted">{p.ownerPhone || "Sin teléfono"}</p></div></div></td>
                      <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 text-ink-muted"><Weight className="size-4" />{p.currentWeightKg ? `${p.currentWeightKg} kg` : "Pendiente"}</span></td>
                      <td className="px-5 py-4"><Badge variant={s.variant} dot>{s.label}</Badge></td>
                      <td className="px-5 py-4 text-right"><Link to={`/pacientes/${p.id}`} onClick={(e) => e.stopPropagation()} className="inline-flex rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:border-brand hover:text-brand-text">Abrir</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <footer className="border-t border-line px-5 py-3 text-xs text-ink-muted">Mostrando {filtered.length} de {patients.length} (máx. 500 recientes)</footer>
      </div>
    </section>
  );
}