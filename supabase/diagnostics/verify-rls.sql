-- AlfaPet: estado de RLS en tablas del esquema public (solo lectura).
select
  n.nspname as esquema,
  c.relname as tabla,
  c.relrowsecurity as rls_habilitado,
  c.relforcerowsecurity as rls_forzado
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;

-- Restricciones/checks que podrían limitar los roles de profiles.
select
  con.conname as restriccion,
  pg_get_constraintdef(con.oid) as definicion
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace n on n.oid = rel.relnamespace
where n.nspname = 'public'
  and rel.relname = 'profiles'
  and con.contype in ('c', 'f')
order by con.conname;
