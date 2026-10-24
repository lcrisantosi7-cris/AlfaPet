-- AlfaPet: auditoría de esquema para preparar migraciones seguras.
-- SOLO LECTURA: no crea, modifica ni elimina objetos ni datos.
-- Ejecutar en Supabase > SQL Editor con una cuenta autorizada.
-- Revisar los resultados antes de diseñar cualquier migración.

-- 1) Tablas públicas, RLS habilitado y FORCE RLS.
select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
order by c.relname;

-- 2) Columnas, tipos, nulabilidad y valores por defecto.
select table_name, ordinal_position, column_name, data_type,
       udt_schema, udt_name, is_nullable, column_default,
       character_maximum_length, numeric_precision, numeric_scale
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

-- 3) Tipos ENUM y sus valores reales (incluye appointment_status, species, sex, app_role si son ENUM).
select ns.nspname as schema_name, typ.typname as enum_name,
       array_agg(en.enumlabel order by en.enumsortorder) as enum_values
from pg_type typ
join pg_enum en on en.enumtypid = typ.oid
join pg_namespace ns on ns.oid = typ.typnamespace
where ns.nspname in ('public', 'app')
group by ns.nspname, typ.typname
order by ns.nspname, typ.typname;

-- 4) Claves primarias, foráneas, UNIQUE, CHECK y restricciones diferibles.
select ns.nspname as schema_name, rel.relname as table_name,
       con.conname as constraint_name,
       case con.contype when 'p' then 'PRIMARY KEY'
                        when 'f' then 'FOREIGN KEY'
                        when 'u' then 'UNIQUE'
                        when 'c' then 'CHECK'
                        when 'x' then 'EXCLUSION'
                        else con.contype::text end as constraint_type,
       pg_get_constraintdef(con.oid, true) as definition,
       con.convalidated as validated, con.condeferrable as deferrable
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace ns on ns.oid = rel.relnamespace
where ns.nspname = 'public'
order by rel.relname, con.contype, con.conname;

-- 5) Índices actuales.
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

-- 6) Políticas RLS actuales.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 7) Triggers de tablas públicas (por ejemplo, updated_at o auditoría).
select event_object_schema as schema_name, event_object_table as table_name,
       trigger_name, event_manipulation, action_timing, action_orientation,
       action_statement
from information_schema.triggers
where event_object_schema = 'public'
order by event_object_table, trigger_name, event_manipulation;

-- 8) Funciones propias de esquemas public/app: firma y definición.
-- Revisar especialmente funciones SECURITY DEFINER y su search_path.
select n.nspname as schema_name, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer,
       p.proconfig as function_settings,
       pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'app')
order by n.nspname, p.proname;

-- 9) Valores existentes que deben normalizarse antes de crear catálogos.
-- No cambiar estos datos hasta revisar el resultado.
select 'products.category' as source_field, coalesce(category, '<NULL>') as current_value,
       count(*) as records
from public.products
group by category
union all
select 'patients.species', species::text, count(*)
from public.patients
group by species::text
union all
select 'patients.breed', coalesce(breed, '<NULL>'), count(*)
from public.patients
group by breed
order by source_field, records desc, current_value;

-- 10) Candidatos a duplicados de propietarios.
-- Es diagnóstico, no afirma que dos personas sean la misma.
select lower(btrim(document_number)) as normalized_document, count(*) as records,
       array_agg(id) as owner_ids
from public.owners
where nullif(btrim(document_number), '') is not null
group by lower(btrim(document_number))
having count(*) > 1
order by records desc;

select lower(btrim(email)) as normalized_email, count(*) as records,
       array_agg(id) as owner_ids
from public.owners
where nullif(btrim(email), '') is not null
group by lower(btrim(email))
having count(*) > 1
order by records desc;

-- 11) Cadenas vacías que pueden afectar unicidad/normalización.
select 'owners.document_number' as source_field, count(*) as empty_values
from public.owners where document_number is not null and btrim(document_number) = ''
union all
select 'owners.email', count(*) from public.owners where email is not null and btrim(email) = ''
union all
select 'owners.phone', count(*) from public.owners where phone is not null and btrim(phone) = ''
union all
select 'patients.microchip', count(*) from public.patients where microchip is not null and btrim(microchip) = ''
union all
select 'products.sku', count(*) from public.products where btrim(sku) = '';

-- 12) Integridad de referencias en citas y consultas.
select 'appointments without active patient' as issue, count(*) as records
from public.appointments a
left join public.patients p on p.id = a.patient_id
where p.id is null or not p.is_active
union all
select 'appointments with inactive/missing vet', count(*)
from public.appointments a
left join public.profiles p on p.id = a.vet_id
where a.vet_id is not null and (p.id is null or not p.is_active or p.role::text <> 'veterinario')
union all
select 'consultations appointment-patient mismatch', count(*)
from public.consultations c
join public.appointments a on a.id = c.appointment_id
where c.patient_id <> a.patient_id;

-- 13) Inventario: categorías, SKU y existencias.
select count(*) filter (where stock < 0) as negative_stock,
       count(*) filter (where min_stock < 0) as negative_min_stock,
       count(*) filter (where nullif(btrim(sku), '') is null) as blank_sku,
       count(*) filter (where nullif(btrim(name), '') is null) as blank_name
from public.products;

-- 14) Estados de citas almacenados y cantidad por estado.
select status::text as status, count(*) as records
from public.appointments
group by status::text
order by status::text;

-- Fin de auditoría. Guardar/exportar los resultados y revisarlos antes de escribir migraciones.
