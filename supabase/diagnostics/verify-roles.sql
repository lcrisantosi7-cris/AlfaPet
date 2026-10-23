-- AlfaPet: diagnóstico de roles y perfiles (solo lectura).
-- Ejecutar en Supabase > SQL Editor.
select
  p.role,
  count(*) as total_perfiles,
  count(*) filter (where p.is_active) as activos,
  count(*) filter (where not p.is_active) as inactivos
from public.profiles p
group by p.role
order by p.role;

-- Roles distintos actualmente almacenados.
select distinct role
from public.profiles
order by role;

-- Verifica que los perfiles tengan una cuenta Auth asociada.
-- Requiere ejecutarse con permisos de administrador en el SQL Editor.
select
  p.id,
  p.full_name,
  p.job_title,
  p.role,
  p.is_active,
  u.email,
  u.email_confirmed_at is not null as correo_confirmado,
  p.created_at
from public.profiles p
left join auth.users u on u.id = p.id
order by p.created_at desc;

-- Busca perfiles con roles fuera de los tres roles soportados por la app.
select id, full_name, role, is_active
from public.profiles
where role not in ('admin', 'veterinario', 'recepcion')
   or role is null;

-- Revisa políticas RLS de las tablas públicas.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
