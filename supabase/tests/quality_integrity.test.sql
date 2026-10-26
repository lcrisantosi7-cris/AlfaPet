-- AlfaPet: prueba estructural de integridad y RLS.
-- Ejecutar en un entorno Supabase de desarrollo con: supabase test db
begin;

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'owners_document_number_normalized_uidx'
  ) then
    raise exception 'Falta el índice de unicidad de documentos de propietarios';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.appointments'::regclass
      and conname = 'appointments_vet_schedule_excl'
  ) then
    raise exception 'Falta la restricción de solapamiento de citas por veterinario';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.appointments'::regclass
      and conname = 'appointments_patient_schedule_excl'
  ) then
    raise exception 'Falta la restricción de solapamiento de citas por paciente';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'appointments'
      and policyname = 'appointments_update'
      and cmd = 'UPDATE'
  ) then
    raise exception 'Falta la política RLS de actualización de citas';
  end if;

  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'appointments'
      and c.relrowsecurity
  ) then
    raise exception 'RLS no está habilitado en appointments';
  end if;
end $$;

rollback;
