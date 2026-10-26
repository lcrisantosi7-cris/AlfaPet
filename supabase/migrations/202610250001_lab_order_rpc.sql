-- Crea una orden de análisis con sus ítems en una sola transacción (precios tomados del catálogo).
drop function if exists public.create_lab_order(uuid, int[], text);
create function public.create_lab_order(p_patient_id uuid, p_service_ids int[], p_notes text default null)
returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_order    uuid;
  v_expected int;
  v_found    int;
begin
  if p_service_ids is null or cardinality(p_service_ids) = 0 then
    raise exception 'Selecciona al menos un análisis' using errcode = '22023';
  end if;

  select count(distinct x) into v_expected from unnest(p_service_ids) as x;
  select count(*) into v_found from public.services
  where id = any (p_service_ids) and category = 'analisis' and is_active;
  if v_found <> v_expected then
    raise exception 'Hay análisis que ya no están disponibles' using errcode = '22023';
  end if;

  insert into public.lab_orders (patient_id, notes)
  values (p_patient_id, nullif(btrim(p_notes), ''))
  returning id into v_order;

  insert into public.lab_order_items (order_id, service_id, price)
  select v_order, s.id, s.base_price from public.services s where s.id = any (p_service_ids);

  return v_order;
end $$;

revoke all on function public.create_lab_order(uuid, int[], text) from public, anon;
grant execute on function public.create_lab_order(uuid, int[], text) to authenticated;