-- AlfaPet: prueba estructural de integridad y RLS adaptada para pgTAP.
-- Ejecutar en un entorno Supabase de desarrollo con: supabase test db

begin;

-- Definimos exactamente 5 aserciones
select plan(5);

-- 1. Verificar el índice único de documentos en propietarios
select has_index(
  'public',
  'owners',
  'owners_document_number_normalized_uidx',
  'Debe existir el índice de unicidad de documentos de propietarios'
);

-- 2. Verificar la restricción de solapamiento por veterinario en appointments
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.appointments'::regclass
      and conname = 'appointments_vet_schedule_excl'
  ),
  'Debe existir la restricción de solapamiento de citas por veterinario'
);

-- 3. Verificar la restricción de solapamiento por paciente en appointments
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.appointments'::regclass
      and conname = 'appointments_patient_schedule_excl'
  ),
  'Debe existir la restricción de solapamiento de citas por paciente'
);

-- 4. Verificar la política RLS de actualización en appointments
select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'appointments'
      and policyname = 'appointments_update'
      and cmd = 'UPDATE'
  ),
  'Debe existir la política RLS de actualización de citas'
);

-- 5. Verificar que RLS esté activo en la tabla appointments
select ok(
  exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'appointments'
      and c.relrowsecurity = true
  ),
  'RLS debe estar habilitado en la tabla appointments'
);

-- Finalizar el plan de pruebas
select * from finish();

rollback;