import { ChevronRight, PawPrint } from "lucide-react";
import { Link } from "react-router";
import { formatDate } from "~/core/lib/format";
import { ActionLink } from "~/core/ui/ActionLink";
import { Avatar } from "~/core/ui/Avatar";
import { EmptyState } from "~/core/ui/EmptyState";
import { SectionCard } from "~/core/ui/SectionCard";
import type { PatientSummary } from "../model/dashboard.types";

const COLUMNS = ["Nombre", "Especie", "Raza", "Dueño", "Fecha de registro"];

export function RecentPatientsCard({ patients }: { patients: readonly PatientSummary[] }) {
  return (
    <SectionCard
      title="Últimos pacientes registrados"
      icon={PawPrint}
      action={<ActionLink to="/pacientes">Ver todos</ActionLink>}
      bodyClassName="overflow-x-auto"
    >
      {patients.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="Aún no hay pacientes registrados"
          description="Usa «Registrar paciente» para agregar al primero."
        />
      ) : (
        <table className="w-full min-w-[34rem] text-left text-sm">
          <caption className="sr-only">Pacientes registrados recientemente</caption>
          <thead className="bg-surface-muted text-xs font-semibold">
            <tr>
              {COLUMNS.map((column) => (
                <th key={column} scope="col" className="px-3 py-2.5 first:rounded-l-lg">
                  {column}
                </th>
              ))}
              <th scope="col" className="px-3 py-2.5 last:rounded-r-lg">
                <span className="sr-only">Ver ficha</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {patients.map((patient) => (
              <tr key={patient.id}>
                <th scope="row" className="px-3 py-2.5 font-semibold">
                  <span className="flex items-center gap-2.5">
                    <Avatar name={patient.name} src={patient.photoUrl} size="sm" />
                    {patient.name}
                  </span>
                </th>
                <td className="px-3 py-2.5 text-ink-muted">{patient.species}</td>
                <td className="px-3 py-2.5 text-ink-muted">{patient.breed}</td>
                <td className="px-3 py-2.5 text-ink-muted">{patient.ownerName}</td>
                <td className="px-3 py-2.5 text-ink-muted">{formatDate(patient.registeredAt)}</td>
                <td className="px-3 py-2.5 text-right">
                  <Link
                    to="/pacientes"
                    aria-label={`Ver ficha de ${patient.name}`}
                    className="inline-flex text-ink-muted hover:text-brand-text"
                  >
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </SectionCard>
  );
}