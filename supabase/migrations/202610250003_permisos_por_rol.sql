-- AlfaPet · permisos por rol (RLS) según la matriz acordada. Idempotente.
-- admin: todo | veterinario: clínica | recepcion: recepción, caja y stock
begin;

create or replace function public.auth_role()
returns public.app_role language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = (select auth.uid()) and is_active $$;
revoke all on function public.auth_role() from public, anon;
grant execute on function public.auth_role() to authenticated;

-- Quita TODAS las políticas del esquema public y las vuelve a crear.
do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- t = tabla; sel/ins/upd/del = roles permitidos ('{}' = nadie directo)
create or replace function pg_temp.rls(t text, sel text[], ins text[], upd text[], del text[])
returns void language plpgsql as $$
declare
  cond text := '(select public.auth_role())::text = any(%L::text[])';
begin
  execute format('alter table public.%I enable row level security', t);
  execute format('create policy %I on public.%I for select to authenticated using (' || cond || ')', t || '_select', t, sel);
  if cardinality(ins) > 0 then
    execute format('create policy %I on public.%I for insert to authenticated with check (' || cond || ')', t || '_insert', t, ins);
  end if;
  if cardinality(upd) > 0 then
    execute format('create policy %I on public.%I for update to authenticated using (' || cond || ') with check (' || cond || ')', t || '_update', t, upd, upd);
  end if;
  if cardinality(del) > 0 then
    execute format('create policy %I on public.%I for delete to authenticated using (' || cond || ')', t || '_delete', t, del);
  end if;
end $$;

-- Catálogos: todos leen, solo admin escribe
select pg_temp.rls(t, '{admin,veterinario,recepcion}', '{admin}', '{admin}', '{admin}')
from unnest(array['care_types','vaccines','services','kennels','species_catalog','breeds','product_categories']) t;

-- Pacientes y propietarios: veterinario solo lectura; recepción crea y edita
select pg_temp.rls(t, '{admin,veterinario,recepcion}', '{admin,recepcion}', '{admin,recepcion}', '{admin}')
from unnest(array['owners','patients']) t;

-- Citas: recepción crea; veterinario y recepción actualizan (atender / reprogramar)
select pg_temp.rls('appointments', '{admin,veterinario,recepcion}', '{admin,recepcion}', '{admin,veterinario,recepcion}', '{admin}');

-- Clínica: solo admin y veterinario
select pg_temp.rls(t, '{admin,veterinario}', '{admin,veterinario}', '{admin,veterinario}', '{admin}')
from unnest(array['consultations','surgeries','lab_order_items','admissions','admission_notes']) t;

-- Vacunas aplicadas: recepción puede ver (recordatorios); solo la clínica registra
select pg_temp.rls('vaccinations', '{admin,veterinario,recepcion}', '{admin,veterinario}', '{admin,veterinario}', '{admin}');

-- Órdenes de análisis y recetas: recepción ve el estado; la clínica crea y edita
select pg_temp.rls(t, '{admin,veterinario,recepcion}', '{admin,veterinario}', '{admin,veterinario}', '{admin}')
from unnest(array['lab_orders','prescriptions','prescription_items']) t;

-- Movimientos de stock: admin y recepción; nunca se editan ni se borran
select pg_temp.rls('stock_movements', '{admin,recepcion}', '{admin,recepcion}', '{}', '{}');

-- Ventas: solo por funciones (register_sale / void_sale); admin y recepción las consultan
select pg_temp.rls(t, '{admin,recepcion}', '{}', '{}', '{}')
from unnest(array['sales','sale_items']) t;

-- Auditoría: solo admin lee; solo los triggers escriben
select pg_temp.rls('audit_log', '{admin}', '{}', '{}', '{}');

-- Productos: admin y recepción ven todo; veterinario solo Farmacia. Escriben admin y recepción.
alter table public.products enable row level security;
create policy products_select on public.products for select to authenticated
  using ((select public.auth_role())::text in ('admin','recepcion')
         or ((select public.auth_role())::text = 'veterinario' and kind = 'farmacia'));
create policy products_insert on public.products for insert to authenticated
  with check ((select public.auth_role())::text in ('admin','recepcion'));
create policy products_update on public.products for update to authenticated
  using ((select public.auth_role())::text in ('admin','recepcion'))
  with check ((select public.auth_role())::text in ('admin','recepcion'));
create policy products_delete on public.products for delete to authenticated
  using ((select public.auth_role())::text = 'admin');

-- Perfiles: el personal activo ve nombres de colegas; cada uno edita su perfil sin cambiar su rol.
alter table public.profiles enable row level security;
create policy profiles_select on public.profiles for select to authenticated
  using ((select public.auth_role()) is not null);
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select public.auth_role()) and is_active);
create policy profiles_update_admin on public.profiles for update to authenticated
  using ((select public.auth_role())::text = 'admin')
  with check ((select public.auth_role())::text = 'admin');

-- Privilegios: anon nada; authenticated limitado por las políticas
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke insert, update, delete on public.clinical_history from authenticated;

-- Auditoría de cambios en datos clínicos y comerciales
create or replace function public.log_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (actor_id, action, table_name, record_id)
  values ((select auth.uid()), tg_op, tg_table_name,
          case when tg_op = 'DELETE' then to_jsonb(old) ->> 'id' else to_jsonb(new) ->> 'id' end);
  return null;
end $$;
revoke all on function public.log_audit() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['owners','patients','appointments','consultations','vaccinations',
                           'surgeries','lab_orders','admissions','prescriptions','sales','products'] loop
    execute format('drop trigger if exists audit_%1$s on public.%1$I', t);
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$I
                      for each row execute function public.log_audit()', t);
  end loop;
end $$;

commit;