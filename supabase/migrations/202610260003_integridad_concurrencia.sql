-- AlfaPet: integridad y concurrencia para ISO/IEC 25010.
-- Requiere ejecutar previamente las migraciones base y 202610250003_permisos_por_rol.sql.
-- La migración falla de forma explícita si ya existen duplicados que deben resolverse manualmente.
begin;

-- Evita propietarios duplicados por documento normalizado.
do $$
begin
  if exists (
    select 1
    from public.owners
    where nullif(btrim(document_number), '') is not null
    group by btrim(document_number)
    having count(*) > 1
  ) then
    raise exception 'No se puede crear la unicidad de propietarios: existen documentos duplicados. Ejecuta diagnostics/audit-schema-readonly.sql y resuélvelos manualmente.' using errcode = '23505';
  end if;
end $$;

create unique index if not exists owners_document_number_normalized_uidx
  on public.owners (btrim(document_number))
  where nullif(btrim(document_number), '') is not null;

-- La duración explícita permite proteger intervalos, no solo horas idénticas.
alter table public.appointments
  add column if not exists duration_minutes integer not null default 30
  check (duration_minutes between 15 and 240);

create extension if not exists btree_gist;

-- 1. Funciones helpers inmutables
create or replace function public.is_not_cancelled(p_status text)
returns boolean
language sql
immutable
as $$
  select coalesce(p_status, '') <> 'cancelada';
$$;

create or replace function public.is_not_cancelled(p_status public.appointment_status)
returns boolean
language sql
immutable
as $$
  select coalesce(p_status::text, '') <> 'cancelada';
$$;

create or replace function public.appointment_range(starts_at timestamptz, duration_mins int)
returns tstzrange
language sql
immutable
as $$
  select tstzrange(starts_at, starts_at + (duration_mins || ' minutes')::interval, '[)');
$$;

do $$
begin
  if exists (
    select 1
    from public.appointments
    where status::text <> 'cancelada'
      and vet_id is not null
    group by vet_id, public.appointment_range(starts_at, duration_minutes)
    having count(*) > 1
  ) then
    raise exception 'No se pueden proteger los horarios: existen citas solapadas para un veterinario. Resuélvelas antes de aplicar la migración.' using errcode = '23P01';
  end if;
end $$;

-- 2. Restricciones usando las funciones inmutables
alter table public.appointments
  drop constraint if exists appointments_vet_schedule_excl;

alter table public.appointments
  add constraint appointments_vet_schedule_excl
  exclude using gist (
    vet_id with =,
    public.appointment_range(starts_at, duration_minutes) with &&
  ) where (vet_id is not null and public.is_not_cancelled(status));

alter table public.appointments
  drop constraint if exists appointments_patient_schedule_excl;

alter table public.appointments
  add constraint appointments_patient_schedule_excl
  exclude using gist (
    patient_id with =,
    public.appointment_range(starts_at, duration_minutes) with &&
  ) where (public.is_not_cancelled(status));

-- La validación no depende únicamente del controlador web.
create or replace function public.guard_appointment_vet_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := (select public.auth_role())::text;
begin
  if tg_op = 'UPDATE' and v_role = 'veterinario' then
    if old.vet_id is not null and old.vet_id is distinct from (select auth.uid()) then
      raise exception 'Un veterinario solo puede actualizar sus propias citas' using errcode = '42501';
    end if;
    if old.vet_id is null and new.vet_id is distinct from (select auth.uid()) then
      raise exception 'El veterinario debe asignarse la cita a sí mismo' using errcode = '42501';
    end if;
    if new.patient_id is distinct from old.patient_id
       or new.care_type_id is distinct from old.care_type_id
       or new.starts_at is distinct from old.starts_at
       or new.duration_minutes is distinct from old.duration_minutes
       or new.notes is distinct from old.notes
       or new.created_by is distinct from old.created_by then
      raise exception 'Un veterinario no puede modificar los datos de programación' using errcode = '42501';
    end if;
    if new.status::text not in ('confirmada', 'completada') then
      raise exception 'Estado no permitido para un veterinario' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.guard_appointment_vet_update() from public, anon, authenticated;
drop trigger if exists appointments_guard_vet_update on public.appointments;
create trigger appointments_guard_vet_update
before update on public.appointments
for each row execute function public.guard_appointment_vet_update();

-- RLS debe limitar las filas actualizables, además de la defensa del trigger.
drop policy if exists appointments_update on public.appointments;
create policy appointments_update
on public.appointments for update to authenticated
using (
  (select public.auth_role())::text in ('admin', 'recepcion')
  or (
    (select public.auth_role())::text = 'veterinario'
    and (vet_id = (select auth.uid()) or (vet_id is null and status::text = 'pendiente'))
  )
)
with check (
  (select public.auth_role())::text in ('admin', 'recepcion')
  or ((select public.auth_role())::text = 'veterinario' and vet_id = (select auth.uid()))
);

commit;