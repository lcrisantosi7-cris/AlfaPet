-- Campos nuevos en pacientes
alter table public.patients
  add column if not exists life_status text not null default 'vivo' check (life_status in ('vivo','fallecido')),
  add column if not exists deceased_at date,
  add column if not exists deceased_notes text check (char_length(deceased_notes) <= 500),
  add column if not exists current_weight_kg numeric check (current_weight_kg > 0),
  add column if not exists weight_updated_at timestamptz,
  add column if not exists color text check (char_length(color) <= 40),
  add column if not exists is_sterilized boolean,
  add column if not exists allergies text check (char_length(allergies) <= 300),
  add column if not exists notes text check (char_length(notes) <= 1000);

alter table public.patients drop constraint if exists patients_dead_inactive_chk;
alter table public.patients add constraint patients_dead_inactive_chk check (life_status = 'vivo' or is_active = false);

-- Historial de peso (weight_kg = peso inicial, current_weight_kg = peso actual)
create table if not exists public.patient_weights (
  id bigint generated always as identity primary key,
  patient_id uuid not null references public.patients(id) on delete cascade,
  weight_kg numeric not null check (weight_kg > 0),
  source text not null default 'manual' check (source in ('registro','consulta','manual')),
  consultation_id uuid references public.consultations(id) on delete set null,
  recorded_by uuid default auth.uid() references public.profiles(id),
  recorded_at timestamptz not null default now()
);
create index if not exists patient_weights_patient_idx on public.patient_weights(patient_id, recorded_at desc);
alter table public.patient_weights enable row level security;
drop policy if exists patient_weights_select on public.patient_weights;
create policy patient_weights_select on public.patient_weights for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active));

-- Backfill: peso inicial pasa a ser peso actual + primer registro del historial
update public.patients set current_weight_kg = weight_kg, weight_updated_at = created_at
 where current_weight_kg is null and weight_kg is not null;
insert into public.patient_weights (patient_id, weight_kg, source, recorded_at)
select p.id, p.weight_kg, 'registro', p.created_at from public.patients p
 where p.weight_kg is not null and not exists (select 1 from public.patient_weights w where w.patient_id = p.id);

-- Trigger: al registrar paciente con peso
create or replace function public.trg_patient_initial_weight() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.weight_kg is not null then
    insert into public.patient_weights (patient_id, weight_kg, source, recorded_by) values (new.id, new.weight_kg, 'registro', new.created_by);
    update public.patients set current_weight_kg = new.weight_kg, weight_updated_at = now() where id = new.id;
  end if;
  return null;
end $$;
drop trigger if exists patient_initial_weight on public.patients;
create trigger patient_initial_weight after insert on public.patients for each row execute function public.trg_patient_initial_weight();

-- Trigger: al registrar/editar el peso en una consulta, se actualiza el peso actual
create or replace function public.trg_consultation_weight() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.weight_kg is not null and (tg_op = 'INSERT' or new.weight_kg is distinct from old.weight_kg) then
    insert into public.patient_weights (patient_id, weight_kg, source, consultation_id, recorded_by)
    values (new.patient_id, new.weight_kg, 'consulta', new.id, new.vet_id);
    update public.patients set current_weight_kg = new.weight_kg, weight_updated_at = now() where id = new.patient_id;
  end if;
  return null;
end $$;
drop trigger if exists consultation_weight on public.consultations;
create trigger consultation_weight after insert or update of weight_kg on public.consultations for each row execute function public.trg_consultation_weight();

-- RPC: peso manual
create or replace function public.register_patient_weight(p_patient uuid, p_weight numeric)
returns void language plpgsql security definer set search_path = '' as $$
declare v_role text;
begin
  select p.role::text into v_role from public.profiles p where p.id = auth.uid() and p.is_active;
  if v_role is null or v_role not in ('admin','recepcion','veterinario') then raise exception 'Sin permiso' using errcode = '42501'; end if;
  if p_weight is null or p_weight <= 0 then raise exception 'Peso no válido' using errcode = '22023'; end if;
  insert into public.patient_weights (patient_id, weight_kg, source) values (p_patient, p_weight, 'manual');
  update public.patients set current_weight_kg = p_weight, weight_updated_at = now() where id = p_patient;
end $$;
revoke all on function public.register_patient_weight(uuid, numeric) from public;
grant execute on function public.register_patient_weight(uuid, numeric) to authenticated;

-- RPC: agregar mascota a un dueño existente (evita duplicar dueños)
create or replace function public.add_patient_to_owner(p_owner_id uuid, p_patient jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_actor uuid := auth.uid(); v_role text; v_p public.patients; v_id uuid; v_sp smallint;
begin
  if v_actor is null then raise exception 'Autenticación requerida' using errcode = '42501'; end if;
  select p.role::text into v_role from public.profiles p where p.id = v_actor and p.is_active;
  if v_role is null or v_role not in ('admin','recepcion') then raise exception 'Sin permiso' using errcode = '42501'; end if;
  if not exists (select 1 from public.owners o where o.id = p_owner_id) then raise exception 'Dueño no encontrado' using errcode = '22023'; end if;
  v_p := jsonb_populate_record(null::public.patients, p_patient);
  select s.id into v_sp from public.species_catalog s where s.code = lower(v_p.species::text);
  insert into public.patients (owner_id, name, species, species_id, breed, sex, birth_date, weight_kg, microchip, created_by)
  values (p_owner_id, btrim(v_p.name), v_p.species, v_sp, nullif(btrim(v_p.breed), ''), v_p.sex, v_p.birth_date, v_p.weight_kg, v_p.microchip, v_actor)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.add_patient_to_owner(uuid, jsonb) from public;
grant execute on function public.add_patient_to_owner(uuid, jsonb) to authenticated;