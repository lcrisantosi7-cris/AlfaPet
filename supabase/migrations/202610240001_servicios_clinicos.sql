-- AlfaPet: cirugías, análisis clínicos, internamiento, farmacia y ventas.
-- Requiere: auth_role(), profiles, owners, patients, appointments, consultations, products, stock_movements.
begin;

-- 0. Utilidad para updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

-- 1. Productos: separar Pet Shop / Farmacia / Insumos
alter table public.products
  add column if not exists kind text not null default 'pet_shop' check (kind in ('pet_shop','farmacia','insumo')),
  add column if not exists requires_prescription boolean not null default false;
create index if not exists products_kind_idx on public.products (kind) where is_active;

-- 2. Catálogo de servicios (también contiene los tipos de análisis y de cirugía)
create table if not exists public.services (
  id smallint generated always as identity primary key,
  code text not null unique check (code = lower(btrim(code)) and char_length(code) between 2 and 40),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  category text not null check (category in ('consulta','cirugia','analisis','internamiento','otro')),
  sample_type text check (char_length(sample_type) <= 40),
  base_price numeric not null default 0 check (base_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. Cirugías
create table if not exists public.surgeries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  appointment_id uuid references public.appointments(id),
  consultation_id uuid references public.consultations(id),
  service_id smallint not null references public.services(id),
  surgeon_id uuid not null references public.profiles(id),
  scheduled_at timestamptz not null,
  status text not null default 'programada' check (status in ('programada','en_curso','completada','cancelada')),
  consent_signed boolean not null default false,
  fasting_confirmed boolean not null default false,
  pre_op_notes text check (char_length(pre_op_notes) <= 2000),
  anesthesia_notes text check (char_length(anesthesia_notes) <= 2000),
  procedure_notes text check (char_length(procedure_notes) <= 4000),
  post_op_instructions text check (char_length(post_op_instructions) <= 2000),
  price numeric not null default 0 check (price >= 0),
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status not in ('en_curso','completada') or consent_signed),
  check (ended_at is null or started_at is null or ended_at >= started_at)
);

-- 4. Análisis clínicos
create table if not exists public.lab_orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  consultation_id uuid references public.consultations(id),
  requested_by uuid not null default auth.uid() references public.profiles(id),
  status text not null default 'solicitado' check (status in ('solicitado','muestra_tomada','en_proceso','completado','cancelado')),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.lab_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.lab_orders(id) on delete cascade,
  service_id smallint not null references public.services(id),
  price numeric not null default 0 check (price >= 0),
  result_value text check (char_length(result_value) <= 500),
  result_unit text check (char_length(result_unit) <= 40),
  reference_range text check (char_length(reference_range) <= 100),
  result_notes text check (char_length(result_notes) <= 1000),
  resulted_by uuid references public.profiles(id),
  resulted_at timestamptz,
  unique (order_id, service_id)
);

-- 5. Internamiento
create table if not exists public.kennels (
  id smallint generated always as identity primary key,
  code text not null unique check (char_length(btrim(code)) between 1 and 20),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  kind text not null default 'jaula' check (kind in ('jaula','cama','aislamiento')),
  is_active boolean not null default true
);
create table if not exists public.admissions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  kennel_id smallint not null references public.kennels(id),
  vet_id uuid not null references public.profiles(id),
  reason text not null check (char_length(btrim(reason)) between 1 and 1000),
  diagnosis text check (char_length(diagnosis) <= 2000),
  status text not null default 'internado' check (status in ('internado','alta','fallecido')),
  admitted_at timestamptz not null default now(),
  discharged_at timestamptz,
  discharge_notes text check (char_length(discharge_notes) <= 2000),
  daily_rate numeric not null default 0 check (daily_rate >= 0),
  created_by uuid default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'internado') = (discharged_at is null))
);
create unique index if not exists admissions_one_active_per_patient on public.admissions (patient_id) where status = 'internado';
create unique index if not exists admissions_one_active_per_kennel on public.admissions (kennel_id) where status = 'internado';
create table if not exists public.admission_notes (
  id bigint generated always as identity primary key,
  admission_id uuid not null references public.admissions(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id),
  note text not null check (char_length(btrim(note)) between 1 and 2000),
  weight_kg numeric check (weight_kg > 0),
  temperature_c numeric check (temperature_c between 30 and 45),
  created_at timestamptz not null default now()
);

-- 6. Recetas (conectan consulta con Farmacia)
create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  consultation_id uuid references public.consultations(id),
  vet_id uuid not null default auth.uid() references public.profiles(id),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null default 1 check (quantity > 0),
  dose text check (char_length(dose) <= 200),
  frequency text check (char_length(frequency) <= 100),
  duration_days integer check (duration_days > 0)
);

-- 7. Ventas (Pet Shop, Farmacia y cobro de servicios)
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_number bigint generated always as identity unique,
  channel text not null check (channel in ('pet_shop','farmacia','servicios')),
  owner_id uuid references public.owners(id),
  patient_id uuid references public.patients(id),
  prescription_id uuid references public.prescriptions(id),
  payment_method text not null check (payment_method in ('efectivo','yape','plin','tarjeta','transferencia')),
  status text not null default 'pagada' check (status in ('pagada','anulada')),
  total numeric not null default 0 check (total >= 0),
  notes text check (char_length(notes) <= 500),
  sold_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  voided_at timestamptz,
  voided_by uuid references public.profiles(id),
  void_reason text check (char_length(void_reason) <= 300),
  check ((status = 'anulada') = (voided_at is not null))
);
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id),
  service_id smallint references public.services(id),
  description text not null check (char_length(description) <= 160),
  quantity integer not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  subtotal numeric generated always as (quantity * unit_price) stored,
  check (num_nonnulls(product_id, service_id) = 1)
);

-- 8. Índices
create index if not exists surgeries_patient_idx on public.surgeries (patient_id, scheduled_at desc);
create index if not exists surgeries_surgeon_idx on public.surgeries (surgeon_id, scheduled_at);
create index if not exists lab_orders_patient_idx on public.lab_orders (patient_id, created_at desc);
create index if not exists lab_order_items_order_idx on public.lab_order_items (order_id);
create index if not exists admissions_patient_idx on public.admissions (patient_id, admitted_at desc);
create index if not exists admission_notes_adm_idx on public.admission_notes (admission_id, created_at desc);
create index if not exists prescriptions_patient_idx on public.prescriptions (patient_id, created_at desc);
create index if not exists prescription_items_rx_idx on public.prescription_items (prescription_id);
create index if not exists sales_created_idx on public.sales (created_at desc);
create index if not exists sale_items_sale_idx on public.sale_items (sale_id);

-- 9. Triggers de updated_at
do $$
declare t text;
begin
  foreach t in array array['surgeries','lab_orders','admissions','prescriptions'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()', t || '_touch', t);
  end loop;
end $$;

-- 10. RLS por rol (mismo patrón que tus catálogos). '{}' = nadie escribe directo (solo por función).
do $$
declare r record;
begin
  for r in select * from (values
    ('services',           '{admin,veterinario,recepcion}', '{admin}',               true),
    ('kennels',            '{admin,veterinario,recepcion}', '{admin}',               true),
    ('surgeries',          '{admin,veterinario}',           '{admin,veterinario}',   true),
    ('lab_orders',         '{admin,veterinario,recepcion}', '{admin,veterinario}',   true),
    ('lab_order_items',    '{admin,veterinario}',           '{admin,veterinario}',   true),
    ('admissions',         '{admin,veterinario}',           '{admin,veterinario}',   true),
    ('admission_notes',    '{admin,veterinario}',           '{admin,veterinario}',   false),
    ('prescriptions',      '{admin,veterinario,recepcion}', '{admin,veterinario}',   true),
    ('prescription_items', '{admin,veterinario,recepcion}', '{admin,veterinario}',   true),
    ('sales',              '{admin,recepcion}',             '{}',                    false),
    ('sale_items',         '{admin,recepcion}',             '{}',                    false)
  ) as t(tbl, read_roles, write_roles, allow_delete)
  loop
    execute format('alter table public.%I enable row level security', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl || '_select', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl || '_insert', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl || '_update', r.tbl);
    execute format('drop policy if exists %I on public.%I', r.tbl || '_delete', r.tbl);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth_role()::text) = any (%L::text[]))', r.tbl || '_select', r.tbl, r.read_roles);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth_role()::text) = any (%L::text[]))', r.tbl || '_insert', r.tbl, r.write_roles);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth_role()::text) = any (%L::text[])) with check ((select auth_role()::text) = any (%L::text[]))', r.tbl || '_update', r.tbl, r.write_roles, r.write_roles);
    if r.allow_delete then
      execute format('create policy %I on public.%I for delete to authenticated using ((select auth_role()::text) = ''admin'')', r.tbl || '_delete', r.tbl);
    end if;
  end loop;
end $$;

-- 11. Ocupación de internamiento para recepción (sin datos clínicos)
create or replace view public.kennel_occupancy as
select k.id, k.code, k.name, k.kind, a.id as admission_id, p.name as patient_name, a.admitted_at
from public.kennels k
left join public.admissions a on a.kennel_id = k.id and a.status = 'internado'
left join public.patients p on p.id = a.patient_id
where k.is_active and (select auth_role()::text) = any (array['admin','veterinario','recepcion']);
revoke all on public.kennel_occupancy from public, anon;
grant select on public.kennel_occupancy to authenticated;

-- 12. Registrar venta: atómico, descuenta stock, usa precios del servidor
create or replace function public.register_sale(
  p_channel text, p_payment_method text, p_owner_id uuid, p_patient_id uuid,
  p_prescription_id uuid, p_notes text, p_items jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid(); v_role text; v_sale_id uuid; v_sale_number bigint;
  v_item jsonb; v_product public.products; v_service public.services;
  v_qty integer; v_total numeric := 0; v_needs_rx boolean := false;
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

  insert into public.sales (channel, payment_method, owner_id, patient_id, prescription_id, notes, sold_by)
  values (p_channel, p_payment_method, p_owner_id, p_patient_id, p_prescription_id, nullif(btrim(p_notes), ''), v_actor)
  returning id, sale_number into v_sale_id, v_sale_number;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty <= 0 then raise exception 'Cantidad no válida' using errcode = '22023'; end if;

    if nullif(v_item ->> 'product_id', '') is not null then
      select * into v_product from public.products
        where id = (v_item ->> 'product_id')::uuid and is_active for update;
      if not found then raise exception 'Producto no disponible' using errcode = '22023'; end if;
      if v_product.stock < v_qty then
        raise exception 'Stock insuficiente para %: quedan %', v_product.name, v_product.stock using errcode = '23514';
      end if;
      if v_product.requires_prescription then v_needs_rx := true; end if;
      update public.products set stock = stock - v_qty, updated_at = now() where id = v_product.id;
      insert into public.stock_movements (product_id, delta, reason, created_by)
        values (v_product.id, -v_qty, 'Venta #' || v_sale_number, v_actor);
      insert into public.sale_items (sale_id, product_id, description, quantity, unit_price)
        values (v_sale_id, v_product.id, left(v_product.name, 160), v_qty, v_product.price);
      v_total := v_total + v_product.price * v_qty;

    elsif nullif(v_item ->> 'service_id', '') is not null then
      select * into v_service from public.services
        where id = (v_item ->> 'service_id')::smallint and is_active;
      if not found then raise exception 'Servicio no disponible' using errcode = '22023'; end if;
      insert into public.sale_items (sale_id, service_id, description, quantity, unit_price)
        values (v_sale_id, v_service.id, left(v_service.name, 160), v_qty, v_service.base_price);
      v_total := v_total + v_service.base_price * v_qty;
    else
      raise exception 'Cada ítem requiere product_id o service_id' using errcode = '22023';
    end if;
  end loop;

  if v_needs_rx and p_prescription_id is null and v_role <> 'admin' then
    raise exception 'Hay medicamentos que requieren receta' using errcode = '23514';
  end if;

  update public.sales set total = v_total where id = v_sale_id;
  return v_sale_id;
end; $$;
revoke all on function public.register_sale(text, text, uuid, uuid, uuid, text, jsonb) from public;
grant execute on function public.register_sale(text, text, uuid, uuid, uuid, text, jsonb) to authenticated;

-- 13. Anular venta (solo admin, devuelve stock)
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
    update public.products set stock = stock + v_item.quantity, updated_at = now() where id = v_item.product_id;
    insert into public.stock_movements (product_id, delta, reason, created_by)
      values (v_item.product_id, v_item.quantity, 'Anulación venta #' || v_sale.sale_number, v_actor);
  end loop;
  update public.sales set status = 'anulada', voided_at = now(), voided_by = v_actor, void_reason = btrim(p_reason) where id = p_sale_id;
end; $$;
revoke all on function public.void_sale(uuid, text) from public;
grant execute on function public.void_sale(uuid, text) to authenticated;

-- 14. Datos iniciales (edita los precios desde el sistema)
insert into public.services (code, name, category, sample_type, base_price) values
  ('consulta-general',        'Consulta general',                    'consulta',      null,     0),
  ('cirugia-esterilizacion',  'Esterilización',                      'cirugia',       null,     0),
  ('cirugia-castracion',      'Castración',                          'cirugia',       null,     0),
  ('cirugia-tejidos-blandos', 'Cirugía de tejidos blandos',          'cirugia',       null,     0),
  ('cirugia-profilaxis',      'Profilaxis dental',                   'cirugia',       null,     0),
  ('lab-hemograma',           'Hemograma completo',                  'analisis',      'Sangre', 0),
  ('lab-bioquimica',          'Perfil bioquímico',                   'analisis',      'Sangre', 0),
  ('lab-urianalisis',         'Urianálisis',                         'analisis',      'Orina',  0),
  ('lab-coproparasitologico', 'Coproparasitológico',                 'analisis',      'Heces',  0),
  ('lab-test-parvovirus',     'Test rápido de parvovirus',           'analisis',      'Heces',  0),
  ('internamiento-dia',       'Internamiento (por día)',             'internamiento', null,     0)
on conflict (code) do nothing;

insert into public.kennels (code, name, kind) values
  ('J-01','Jaula 1','jaula'), ('J-02','Jaula 2','jaula'), ('J-03','Jaula 3','jaula'),
  ('J-04','Jaula 4','jaula'), ('A-01','Aislamiento 1','aislamiento')
on conflict (code) do nothing;

commit;