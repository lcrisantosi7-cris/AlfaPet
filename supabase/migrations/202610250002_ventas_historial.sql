-- AlfaPet · ajustes de ventas/stock y historial clínico unificado. Idempotente.
begin;

-- 1. STOCK: los movimientos son la única fuente de verdad
do $$
declare r record;
begin
  for r in
    select t.tgname
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'stock_movements'
      and not t.tgisinternal and t.tgname <> 'stock_movements_apply'
      and pg_get_functiondef(t.tgfoid) ilike '%products%'
  loop
    execute format('drop trigger %I on public.stock_movements', r.tgname);
    raise notice 'Trigger eliminado: %', r.tgname;
  end loop;
end $$;

create or replace function public.apply_stock_movement()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.products set stock = stock + new.delta, updated_at = now() where id = new.product_id;
  if not found then raise exception 'Producto no encontrado' using errcode = 'P0002'; end if;
  return null;
end; $$;
revoke all on function public.apply_stock_movement() from public, anon, authenticated;

drop trigger if exists stock_movements_apply on public.stock_movements;
create trigger stock_movements_apply after insert on public.stock_movements
  for each row execute function public.apply_stock_movement();

create or replace function public.register_sale(
  p_channel text, p_payment_method text, p_owner_id uuid, p_patient_id uuid,
  p_prescription_id uuid, p_notes text, p_items jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid(); v_role text; v_sale_id uuid; v_sale_number bigint;
  v_item record; v_product public.products; v_service public.services;
  v_total numeric := 0; v_needs_rx boolean := false;
begin
  if v_actor is null then raise exception 'Autenticación requerida' using errcode = '42501'; end if;
  select p.role::text into v_role from public.profiles p where p.id = v_actor and p.is_active;
  if v_role is null or v_role not in ('admin','recepcion') then
    raise exception 'No tienes permiso para registrar ventas' using errcode = '42501';
  end if;
  if p_channel not in ('pet_shop','farmacia','servicios') then raise exception 'Canal de venta no válido' using errcode = '22023'; end if;
  if p_payment_method not in ('efectivo','yape','plin','tarjeta','transferencia') then raise exception 'Método de pago no válido' using errcode = '22023'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta no tiene ítems' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(p_items) e
             where coalesce((e ->> 'quantity')::int, 0) <= 0
                or num_nonnulls(nullif(e ->> 'product_id', ''), nullif(e ->> 'service_id', '')) <> 1) then
    raise exception 'Ítems de venta no válidos' using errcode = '22023';
  end if;

  insert into public.sales (channel, payment_method, owner_id, patient_id, prescription_id, notes, sold_by)
  values (p_channel, p_payment_method, p_owner_id, p_patient_id, p_prescription_id, nullif(btrim(p_notes), ''), v_actor)
  returning id, sale_number into v_sale_id, v_sale_number;

  for v_item in
    select nullif(e ->> 'product_id', '')::uuid as product_id,
           nullif(e ->> 'service_id', '')::smallint as service_id,
           sum((e ->> 'quantity')::int)::int as qty
    from jsonb_array_elements(p_items) e
    group by 1, 2
    order by 1 nulls last, 2
  loop
    if v_item.product_id is not null then
      select * into v_product from public.products where id = v_item.product_id and is_active for update;
      if not found then raise exception 'Producto no disponible' using errcode = '22023'; end if;
      if v_product.stock < v_item.qty then
        raise exception 'Stock insuficiente para %: quedan %', v_product.name, v_product.stock using errcode = '23514';
      end if;
      if v_product.requires_prescription then v_needs_rx := true; end if;
      insert into public.stock_movements (product_id, delta, reason, created_by)
        values (v_product.id, -v_item.qty, 'Venta #' || v_sale_number, v_actor);
      insert into public.sale_items (sale_id, product_id, description, quantity, unit_price)
        values (v_sale_id, v_product.id, left(v_product.name, 160), v_item.qty, v_product.price);
      v_total := v_total + v_product.price * v_item.qty;
    else
      select * into v_service from public.services where id = v_item.service_id and is_active;
      if not found then raise exception 'Servicio no disponible' using errcode = '22023'; end if;
      insert into public.sale_items (sale_id, service_id, description, quantity, unit_price)
        values (v_sale_id, v_service.id, left(v_service.name, 160), v_item.qty, v_service.base_price);
      v_total := v_total + v_service.base_price * v_item.qty;
    end if;
  end loop;

  if v_needs_rx and p_prescription_id is null and v_role <> 'admin' then
    raise exception 'Hay medicamentos que requieren receta' using errcode = '23514';
  end if;

  update public.sales set total = v_total where id = v_sale_id;
  return v_sale_id;
end; $$;
revoke all on function public.register_sale(text, text, uuid, uuid, uuid, text, jsonb) from public, anon;
grant execute on function public.register_sale(text, text, uuid, uuid, uuid, text, jsonb) to authenticated;

create or replace function public.void_sale(p_sale_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_actor uuid := auth.uid(); v_role text; v_sale public.sales; v_item record;
begin
  if v_actor is null then raise exception 'Autenticación requerida' using errcode = '42501'; end if;
  select p.role::text into v_role from public.profiles p where p.id = v_actor and p.is_active;
  if v_role is distinct from 'admin' then raise exception 'Solo un administrador puede anular ventas' using errcode = '42501'; end if;
  if p_reason is null or char_length(btrim(p_reason)) < 3 then raise exception 'Indica el motivo de la anulación' using errcode = '22023'; end if;
  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then raise exception 'Venta no encontrada' using errcode = 'P0002'; end if;
  if v_sale.status = 'anulada' then raise exception 'La venta ya fue anulada' using errcode = '22023'; end if;
  for v_item in select product_id, quantity from public.sale_items where sale_id = p_sale_id and product_id is not null loop
    insert into public.stock_movements (product_id, delta, reason, created_by)
      values (v_item.product_id, v_item.quantity, 'Anulación venta #' || v_sale.sale_number, v_actor);
  end loop;
  update public.sales set status = 'anulada', voided_at = now(), voided_by = v_actor, void_reason = btrim(p_reason) where id = p_sale_id;
end; $$;
revoke all on function public.void_sale(uuid, text) from public, anon;
grant execute on function public.void_sale(uuid, text) to authenticated;

-- 2. HISTORIAL CLÍNICO UNIFICADO (respeta el RLS de cada tabla)
create or replace view public.clinical_history with (security_invoker = true) as
  select c.created_at as occurred_at, 'Consulta'::text as record_type, c.patient_id, p.name as patient_name,
         coalesce(nullif(btrim(c.diagnosis), ''), 'Consulta clínica') as title,
         nullif(concat_ws(' · ', 'Síntomas: ' || nullif(c.symptoms, ''), 'Tratamiento: ' || nullif(c.treatment, '')), '') as detail,
         null::text as status, pr.full_name as author_name, 'consultations'::text as source_table, c.id::text as source_id
  from public.consultations c
  join public.patients p on p.id = c.patient_id
  left join public.profiles pr on pr.id = c.vet_id
union all
  select coalesce((v.applied_at::timestamp at time zone 'America/Lima'), v.created_at), 'Vacunación', v.patient_id, p.name,
         vc.name,
         nullif(concat_ws(' · ', 'Lote: ' || nullif(v.lot, ''), 'Próxima dosis: ' || to_char(v.due_date, 'DD/MM/YYYY')), ''),
         case when v.applied_at is null then 'pendiente' else 'aplicada' end, pr.full_name, 'vaccinations', v.id::text
  from public.vaccinations v
  join public.patients p on p.id = v.patient_id
  join public.vaccines vc on vc.id = v.vaccine_id
  left join public.profiles pr on pr.id = v.administered_by
union all
  select coalesce(s.started_at, s.scheduled_at), 'Cirugía', s.patient_id, p.name, sv.name,
         nullif(concat_ws(' · ', nullif(s.procedure_notes, ''), nullif(s.post_op_instructions, '')), ''),
         s.status, pr.full_name, 'surgeries', s.id::text
  from public.surgeries s
  join public.patients p on p.id = s.patient_id
  join public.services sv on sv.id = s.service_id
  left join public.profiles pr on pr.id = s.surgeon_id
union all
  select o.created_at, 'Análisis', o.patient_id, p.name,
         coalesce((select string_agg(sv.name, ', ' order by sv.name)
                   from public.lab_order_items i join public.services sv on sv.id = i.service_id
                   where i.order_id = o.id), 'Orden de análisis'),
         nullif(o.notes, ''), o.status, pr.full_name, 'lab_orders', o.id::text
  from public.lab_orders o
  join public.patients p on p.id = o.patient_id
  left join public.profiles pr on pr.id = o.requested_by
union all
  select a.admitted_at, 'Internamiento', a.patient_id, p.name, 'Internamiento en ' || k.name,
         nullif(concat_ws(' · ', a.reason, 'Alta: ' || nullif(a.discharge_notes, '')), ''),
         a.status, pr.full_name, 'admissions', a.id::text
  from public.admissions a
  join public.patients p on p.id = a.patient_id
  join public.kennels k on k.id = a.kennel_id
  left join public.profiles pr on pr.id = a.vet_id
union all
  select rx.created_at, 'Receta', rx.patient_id, p.name, 'Receta médica',
         coalesce((select string_agg(pd.name || ' x' || ri.quantity, ', ' order by pd.name)
                   from public.prescription_items ri join public.products pd on pd.id = ri.product_id
                   where ri.prescription_id = rx.id), nullif(rx.notes, '')),
         null::text, pr.full_name, 'prescriptions', rx.id::text
  from public.prescriptions rx
  join public.patients p on p.id = rx.patient_id
  left join public.profiles pr on pr.id = rx.vet_id;

revoke all on public.clinical_history from public, anon;
grant select on public.clinical_history to authenticated;

commit;