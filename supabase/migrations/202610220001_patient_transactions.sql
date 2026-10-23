-- AlfaPet: funciones transaccionales para el registro de pacientes.
-- Ejecutar en Supabase SQL Editor después de crear tablas, enums y políticas RLS.

create or replace function public.create_patient_with_owner(p_owner jsonb, p_patient jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid(); v_role text; v_owner_id uuid; v_patient public.patients; v_patient_id uuid; v_document text;
begin
  if v_actor is null then raise exception 'Autenticación requerida' using errcode = '42501'; end if;
  select p.role::text into v_role from public.profiles p where p.id = v_actor and p.is_active = true;
  if v_role is null or v_role not in ('admin', 'veterinario', 'recepcion') then raise exception 'No tienes permiso para registrar pacientes' using errcode = '42501'; end if;
  if p_owner is null or p_patient is null or jsonb_typeof(p_owner) <> 'object' or jsonb_typeof(p_patient) <> 'object' then
    raise exception 'Datos de propietario o paciente no válidos' using errcode = '22023';
  end if;
  v_document := nullif(btrim(p_owner ->> 'document_number'), '');
  if v_document is not null then
    select o.id into v_owner_id from public.owners o where o.document_number = v_document order by o.created_at limit 1;
  end if;
  if v_owner_id is null then
    insert into public.owners (full_name, phone, email, document_number, address, created_by)
    values (btrim(p_owner ->> 'full_name'), nullif(btrim(p_owner ->> 'phone'), ''), nullif(btrim(p_owner ->> 'email'), ''), v_document, nullif(btrim(p_owner ->> 'address'), ''), v_actor)
    returning id into v_owner_id;
  end if;
  v_patient := jsonb_populate_record(null::public.patients, p_patient);
  insert into public.patients (owner_id, name, species, breed, sex, birth_date, weight_kg, microchip, created_by)
  values (v_owner_id, btrim(v_patient.name), v_patient.species, nullif(btrim(v_patient.breed), ''), v_patient.sex, v_patient.birth_date, v_patient.weight_kg, v_patient.microchip, v_actor)
  returning id into v_patient_id;
  return v_patient_id;
end; $$;
revoke all on function public.create_patient_with_owner(jsonb, jsonb) from public;
grant execute on function public.create_patient_with_owner(jsonb, jsonb) to authenticated;

create or replace function public.get_patient_options()
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_species_type text; v_sex_type text; v_species jsonb := '[]'::jsonb; v_sex jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then raise exception 'Autenticación requerida' using errcode = '42501'; end if;
  select c.udt_name into v_species_type from information_schema.columns c where c.table_schema='public' and c.table_name='patients' and c.column_name='species';
  select c.udt_name into v_sex_type from information_schema.columns c where c.table_schema='public' and c.table_name='patients' and c.column_name='sex';
  select coalesce(jsonb_agg(e.enumlabel order by e.enumsortorder), '[]'::jsonb) into v_species from pg_catalog.pg_type t join pg_catalog.pg_enum e on e.enumtypid=t.oid where t.typname=v_species_type;
  if v_sex_type is not null then
    select coalesce(jsonb_agg(e.enumlabel order by e.enumsortorder), '[]'::jsonb) into v_sex from pg_catalog.pg_type t join pg_catalog.pg_enum e on e.enumtypid=t.oid where t.typname=v_sex_type;
  end if;
  return jsonb_build_object('species',v_species,'sex',v_sex);
end; $$;
revoke all on function public.get_patient_options() from public;
grant execute on function public.get_patient_options() to authenticated;
