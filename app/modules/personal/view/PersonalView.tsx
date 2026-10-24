import { useMemo, useState } from "react";
import { ConfirmForm } from "~/core/feedback/ConfirmForm";
import { useActionToast } from "~/core/feedback/use-action-toast";
import { Form, useActionData } from "react-router";
import { ShieldCheck, Stethoscope, UserRound, UsersRound } from "lucide-react";
import { PageHeader } from "~/core/ui/PageHeader";

type Profile = { id: string; full_name: string; job_title: string | null; role: "admin" | "veterinario" | "recepcion"; is_active: boolean; created_at: string };
type ActionResult = { ok?: boolean; message?: string };
const ROLE_LABEL: Record<Profile["role"], string> = { admin: "Administrador", veterinario: "Veterinario", recepcion: "Recepcionista" };
const ROLE_DESC: Record<Profile["role"], string> = {
  admin: "Administra el sistema, usuarios, permisos y reportes.",
  veterinario: "Atención clínica, consultas, historial y vacunación.",
  recepcion: "Propietarios, mascotas, citas y tareas administrativas.",
};

export function PersonalView({ profiles }: { profiles: Profile[] }) {
  const actionData = useActionData<ActionResult>();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("es");
    return profiles.filter(p => !q || [p.full_name, p.job_title, p.role].some(v => v?.toLocaleLowerCase("es").includes(q)));
  }, [profiles, query]);
  return <section className="mx-auto flex max-w-[1500px] flex-col gap-6">
    <PageHeader
      eyebrow="AlfaPet · Administración"
      title="Gestión de personal"
      description="Crea cuentas para veterinarios y recepción, asigna responsabilidades y desactiva accesos cuando una persona deje de trabajar en la clínica."
    />
    {actionData?.message && <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${actionData.ok ? "border-tone-green-soft bg-tone-green-soft text-tone-green-fg" : "border-tone-amber-soft bg-tone-amber-soft text-tone-amber-fg"}`}>{actionData.message}</p>}
    <div className="grid gap-4 md:grid-cols-3">
      {(["admin", "veterinario", "recepcion"] as const).map(role => {
        const Icon = role === "admin" ? ShieldCheck : role === "veterinario" ? Stethoscope : UserRound;
        return <article key={role} className="ui-card rounded-2xl border border-line bg-surface p-5 shadow-card">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-text"><Icon className="size-5" /></span>
          <h2 className="mt-3 font-bold">{ROLE_LABEL[role]}</h2>
          <p className="mt-1 text-sm text-ink-muted">{ROLE_DESC[role]}</p>
          <p className="mt-3 text-xs text-ink-muted">{profiles.filter(p => p.role === role && p.is_active).length} cuentas activas</p>
        </article>;
      })}
    </div>
    <details className="ui-card rounded-2xl border border-line bg-surface shadow-card" open>
      <summary className="cursor-pointer list-none px-5 py-4 font-bold"><UsersRound className="mr-2 inline size-5 align-[-4px]" /> Crear cuenta de personal</summary>
      <Form method="post" className="grid gap-4 border-t border-line p-5 sm:grid-cols-2 xl:grid-cols-3">
        <input type="hidden" name="intent" value="create" />
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted">Nombre completo<input name="full_name" required minLength={2} maxLength={120} autoComplete="name" className="ui-field h-11 rounded-xl border border-line bg-surface px-3 text-sm font-normal text-ink" /></label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted">Correo de acceso<input name="email" type="email" required maxLength={254} autoComplete="email" className="ui-field h-11 rounded-xl border border-line bg-surface px-3 text-sm font-normal text-ink" /></label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted">Cargo<input name="job_title" required maxLength={100} placeholder="Ej. Médico veterinario" className="ui-field h-11 rounded-xl border border-line bg-surface px-3 text-sm font-normal text-ink" /></label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted">Rol<select name="role" required defaultValue="veterinario" className="ui-field h-11 rounded-xl border border-line bg-surface px-3 text-sm font-normal text-ink"><option value="veterinario">Veterinario</option><option value="recepcion">Recepcionista</option><option value="admin">Administrador</option></select></label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-muted sm:col-span-2">Contraseña inicial (mínimo 12 caracteres)<input name="password" type="password" required minLength={12} autoComplete="new-password" className="ui-field h-11 rounded-xl border border-line bg-surface px-3 text-sm font-normal text-ink" /><span className="font-normal">Entrega la contraseña de forma segura y recomienda cambiarla después del primer acceso.</span></label>
        <div className="flex items-end"><button type="submit" className="ui-button h-11 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand hover:opacity-90">Crear cuenta</button></div>
      </Form>
    </details>
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold">Cuentas registradas</h2><p className="mt-1 text-sm text-ink-muted">{profiles.length} usuarios en el sistema</p></div><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre, cargo o rol..." aria-label="Buscar personal" className="ui-field h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm sm:max-w-sm" /></div>
      {filtered.length === 0 ? <p className="px-5 py-12 text-center text-sm text-ink-muted">No hay cuentas que coincidan con la búsqueda.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink-muted"><tr><th className="px-5 py-4">Personal</th><th className="px-5 py-4">Rol</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4">Cambiar rol</th><th className="px-5 py-4">Acceso</th></tr></thead><tbody className="divide-y divide-line">{filtered.map(profile => <tr key={profile.id} className="transition-colors hover:bg-surface-muted/50"><td className="px-5 py-4"><p className="font-semibold">{profile.full_name}</p><p className="mt-1 text-xs text-ink-muted">{profile.job_title || "Sin cargo definido"}</p></td><td className="px-5 py-4">{ROLE_LABEL[profile.role]}</td><td className="px-5 py-4"><span className={profile.is_active ? "rounded-full bg-tone-green-soft px-2.5 py-1 text-xs font-semibold text-tone-green-fg" : "rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-muted"}>{profile.is_active ? "Activa" : "Inactiva"}</span></td><td className="px-5 py-4"><Form method="post" className="flex items-center gap-2"><input type="hidden" name="intent" value="change-role" /><input type="hidden" name="profile_id" value={profile.id} /><select name="role" defaultValue={profile.role} className="h-9 rounded-lg border border-line bg-bg px-2 text-xs">{(["admin", "veterinario", "recepcion"] as const).map(role => <option key={role} value={role}>{ROLE_LABEL[role]}</option>)}</select><button className="ui-button rounded-lg border border-line px-3 py-2 text-xs font-semibold hover:bg-surface-muted" type="submit">Guardar</button></Form></td><td className="px-5 py-4"><Form method="post"><input type="hidden" name="intent" value="toggle-active" /><input type="hidden" name="profile_id" value={profile.id} /><input type="hidden" name="active" value={String(!profile.is_active)} /><button type="submit" disabled={profile.role === "admin" && profile.is_active && profiles.filter(p => p.role === "admin" && p.is_active).length === 1} className="ui-button rounded-lg border border-line px-3 py-2 text-xs font-semibold hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40">{profile.is_active ? "Desactivar" : "Activar"}</button></Form></td></tr>)}</tbody></table></div>}
    </div>
  </section>;
}

