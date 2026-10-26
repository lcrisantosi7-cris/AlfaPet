


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'veterinario',
    'recepcion'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."appointment_status" AS ENUM (
    'pendiente',
    'confirmada',
    'completada',
    'cancelada'
);


ALTER TYPE "public"."appointment_status" OWNER TO "postgres";


CREATE TYPE "public"."patient_sex" AS ENUM (
    'macho',
    'hembra'
);


ALTER TYPE "public"."patient_sex" OWNER TO "postgres";


CREATE TYPE "public"."sex" AS ENUM (
    'macho',
    'hembra',
    'macho_castrado',
    'hembra_esterilizada'
);


ALTER TYPE "public"."sex" OWNER TO "postgres";


CREATE TYPE "public"."species" AS ENUM (
    'perro',
    'gato',
    'otro'
);


ALTER TYPE "public"."species" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."apply_policies"("tbl" "regclass", "read_roles" "text"[], "write_roles" "text"[], "delete_roles" "text"[], "allow_update" boolean DEFAULT true) RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare t text := tbl::text;
begin
  execute format('alter table %s enable row level security', t);

  if read_roles is not null then
    execute format('drop policy if exists "select por rol" on %s', t);
    execute format('create policy "select por rol" on %s for select to authenticated
      using ((select private.has_role(%L::public.app_role[])))', t, read_roles);
  end if;

  if write_roles is not null then
    execute format('drop policy if exists "insert por rol" on %s', t);
    execute format('create policy "insert por rol" on %s for insert to authenticated
      with check ((select private.has_role(%L::public.app_role[])))', t, write_roles);

    if allow_update then
      execute format('drop policy if exists "update por rol" on %s', t);
      execute format('create policy "update por rol" on %s for update to authenticated
        using ((select private.has_role(%L::public.app_role[])))
        with check ((select private.has_role(%L::public.app_role[])))', t, write_roles, write_roles);
    end if;
  end if;

  if delete_roles is not null then
    execute format('drop policy if exists "delete por rol" on %s', t);
    execute format('create policy "delete por rol" on %s for delete to authenticated
      using ((select private.has_role(%L::public.app_role[])))', t, delete_roles);
  end if;
end $$;


ALTER FUNCTION "private"."apply_policies"("tbl" "regclass", "read_roles" "text"[], "write_roles" "text"[], "delete_roles" "text"[], "allow_update" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."apply_stock_movement"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  update public.products set stock = stock + new.delta where id = new.product_id;
  return null;
end $$;


ALTER FUNCTION "private"."apply_stock_movement"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."current_app_role"() RETURNS "public"."app_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select role from public.profiles where id = (select auth.uid()) and is_active
$$;


ALTER FUNCTION "private"."current_app_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    'recepcion'
  );
  return new;
end $$;


ALTER FUNCTION "private"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."has_role"("roles" "public"."app_role"[]) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select coalesce(private.current_app_role() = any (roles), false)
$$;


ALTER FUNCTION "private"."has_role"("roles" "public"."app_role"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."log_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.audit_log (actor_id, action, table_name, record_id)
  values ((select auth.uid()), tg_op, tg_table_name,
          coalesce(to_jsonb(new) ->> 'id', to_jsonb(old) ->> 'id'));
  return null;
end $$;


ALTER FUNCTION "private"."log_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;


ALTER FUNCTION "private"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_patient_to_owner"("p_owner_id" "uuid", "p_patient" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."add_patient_to_owner"("p_owner_id" "uuid", "p_patient" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_set_profile"("target" "uuid", "new_role" "public"."app_role", "new_active" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_current_role public.app_role;
    v_current_active boolean;
    v_active_admins bigint;
BEGIN
    -- Solo un administrador activo puede realizar cambios.
    IF NOT private.has_role(
        ARRAY['admin']::public.app_role[]
    ) THEN
        RAISE EXCEPTION 'No autorizado'
            USING ERRCODE = '42501';
    END IF;

    -- Rechazar parámetros incompletos.
    IF target IS NULL
       OR new_role IS NULL
       OR new_active IS NULL THEN
        RAISE EXCEPTION 'Los datos del perfil son obligatorios'
            USING ERRCODE = '22023';
    END IF;

    -- Serializar los cambios de administradores realizados
    -- mediante esta función.
    PERFORM pg_catalog.pg_advisory_xact_lock(73104, 1);

    -- Bloquear el perfil objetivo durante la modificación.
    SELECT p.role, p.is_active
      INTO v_current_role, v_current_active
      FROM public.profiles AS p
     WHERE p.id = target
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Perfil no encontrado'
            USING ERRCODE = 'P0002';
    END IF;

    -- Impedir que el usuario quite sus propios privilegios
    -- administrativos o desactive su cuenta.
    IF target = (SELECT auth.uid())
       AND (
           new_active IS FALSE
           OR new_role IS DISTINCT FROM 'admin'::public.app_role
       ) THEN
        RAISE EXCEPTION
            'No puedes quitarte tu propio acceso de administrador'
            USING ERRCODE = '42501';
    END IF;

    -- No permitir que desaparezca el último administrador activo.
    IF v_current_active IS TRUE
       AND v_current_role = 'admin'::public.app_role
       AND (
           new_active IS FALSE
           OR new_role IS DISTINCT FROM 'admin'::public.app_role
       ) THEN

        SELECT count(*)
          INTO v_active_admins
          FROM public.profiles AS p
         WHERE p.role = 'admin'::public.app_role
           AND p.is_active IS TRUE;

        IF v_active_admins <= 1 THEN
            RAISE EXCEPTION
                'No se puede desactivar ni degradar al último administrador activo'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    UPDATE public.profiles
       SET role = new_role,
           is_active = new_active
     WHERE id = target;
END;
$$;


ALTER FUNCTION "public"."admin_set_profile"("target" "uuid", "new_role" "public"."app_role", "new_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_stock_movement"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  update public.products set stock = stock + new.delta, updated_at = now() where id = new.product_id;
  if not found then raise exception 'Producto no encontrado' using errcode = 'P0002'; end if;
  return null;
end; $$;


ALTER FUNCTION "public"."apply_stock_movement"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_role"() RETURNS "public"."app_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$ select role from public.profiles where id = (select auth.uid()) and is_active $$;


ALTER FUNCTION "public"."auth_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_lab_order"("p_patient_id" "uuid", "p_service_ids" integer[], "p_notes" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."create_lab_order"("p_patient_id" "uuid", "p_service_ids" integer[], "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_patient_with_owner"("p_owner" "jsonb", "p_patient" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  v_owner   uuid;
  v_patient uuid;
begin
  if nullif(p_owner ->> 'document_number', '') is not null then
    select id into v_owner from public.owners
    where document_number = p_owner ->> 'document_number' limit 1;
  end if;

  if v_owner is null then
    insert into public.owners (full_name, phone, email, document_number, address)
    select o.full_name, o.phone, o.email, o.document_number, o.address
    from jsonb_populate_record(null::public.owners, p_owner) o
    returning id into v_owner;
  end if;

  insert into public.patients (owner_id, name, species, breed, sex, birth_date, weight_kg, microchip)
  select v_owner, p.name, p.species, p.breed, p.sex, p.birth_date, p.weight_kg, p.microchip
  from jsonb_populate_record(null::public.patients, p_patient) p
  returning id into v_patient;

  return v_patient;
end $$;


ALTER FUNCTION "public"."create_patient_with_owner"("p_owner" "jsonb", "p_patient" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_update_product_stock"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.products
  SET stock = stock + NEW.delta, updated_at = now()
  WHERE id = NEW.product_id;
  
  IF (SELECT stock FROM public.products WHERE id = NEW.product_id) < 0 THEN
    RAISE EXCEPTION 'Stock insuficiente para realizar esta operación.';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_update_product_stock"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_overview"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO ''
    AS $$
declare
  tz       constant text := 'America/Lima';
  v_today  date := (now() at time zone 'America/Lima')::date;
  v_rev    jsonb; v_channels jsonb; v_agenda jsonb; v_attention jsonb;
begin
  if (select public.auth_role())::text is distinct from 'admin' then
    raise exception 'Solo administradores' using errcode = '42501';
  end if;

  select jsonb_agg(jsonb_build_object('date', d.day, 'total', coalesce(s.total, 0), 'count', coalesce(s.n, 0)) order by d.day)
  into v_rev
  from (select generate_series(v_today - 13, v_today, interval '1 day')::date as day) d
  left join (
    select (created_at at time zone tz)::date as day, sum(total) as total, count(*)::int as n
    from public.sales
    where status = 'pagada' and (created_at at time zone tz)::date >= v_today - 13
    group by 1
  ) s on s.day = d.day;

  select coalesce(jsonb_agg(jsonb_build_object('channel', c.channel, 'total', c.total) order by c.total desc), '[]'::jsonb)
  into v_channels
  from (
    select channel, sum(total) as total from public.sales
    where status = 'pagada' and created_at >= now() - interval '30 days'
    group by channel
  ) c;

  select coalesce(jsonb_agg(jsonb_build_object(
      'kind', x.kind, 'id', x.id, 'at', x.at, 'title', x.title, 'subtitle', x.subtitle, 'status', x.status
    ) order by x.at), '[]'::jsonb)
  into v_agenda
  from (
    select * from (
      select 'cita'::text as kind, a.id::text as id, a.starts_at as at, p.name as title,
             ct.label as subtitle, a.status::text as status
      from public.appointments a
      join public.patients p on p.id = a.patient_id
      join public.care_types ct on ct.id = a.care_type_id
      where (a.starts_at at time zone tz)::date = v_today and a.status::text <> 'cancelada'
      union all
      select 'cirugia', s.id::text, s.scheduled_at, p.name, sv.name, s.status
      from public.surgeries s
      join public.patients p on p.id = s.patient_id
      join public.services sv on sv.id = s.service_id
      where (s.scheduled_at at time zone tz)::date = v_today and s.status <> 'cancelada'
    ) u
    order by at
    limit 14
  ) x;

  select coalesce(jsonb_agg(jsonb_build_object(
      'type', y.type, 'severity', y.severity, 'title', y.title, 'detail', y.detail, 'href', y.href
    ) order by case y.severity when 'high' then 0 else 1 end, y.rn), '[]'::jsonb)
  into v_attention
  from (
    select *, row_number() over (partition by type order by sort_key) as rn from (
      select 'stock'::text as type,
             case when pr.stock = 0 then 'high' else 'medium' end as severity,
             pr.name as title,
             case when pr.stock = 0 then 'Agotado' else 'Quedan ' || pr.stock || ' (mínimo ' || pr.min_stock || ')' end as detail,
             '/productos'::text as href, pr.stock::numeric as sort_key
      from public.products pr
      where pr.is_active and pr.min_stock > 0 and pr.stock <= pr.min_stock
      union all
      select 'surgery_consent', 'high', p.name || ' · ' || sv.name,
             'Falta el consentimiento · ' || to_char(s.scheduled_at at time zone tz, 'DD/MM HH24:MI'),
             '/cirugias/' || s.id, extract(epoch from s.scheduled_at)
      from public.surgeries s
      join public.patients p on p.id = s.patient_id
      join public.services sv on sv.id = s.service_id
      where s.status = 'programada' and not s.consent_signed
        and s.scheduled_at between now() and now() + interval '48 hours'
      union all
      select 'vaccine_overdue', 'medium', p.name || ' · ' || vc.name,
             'Vencida hace ' || (v_today - v.due_date) || ' día(s)',
             '/vacunas', (v.due_date - v_today)::numeric
      from public.vaccinations v
      join public.patients p on p.id = v.patient_id
      join public.vaccines vc on vc.id = v.vaccine_id
      where v.applied_at is null and v.due_date < v_today
      union all
      select 'lab_pending', 'medium', p.name,
             'Sin resultados hace ' || floor(extract(epoch from now() - o.created_at) / 3600)::int || ' h',
             '/analisis/' || o.id, extract(epoch from o.created_at)
      from public.lab_orders o
      join public.patients p on p.id = o.patient_id
      where o.status in ('solicitado', 'muestra_tomada', 'en_proceso') and o.created_at < now() - interval '24 hours'
    ) a
  ) y
  where y.rn <= 3;

  return jsonb_build_object(
    'revenue', jsonb_build_object(
      'today', (select coalesce(sum(total), 0) from public.sales where status = 'pagada' and (created_at at time zone tz)::date = v_today),
      'yesterday', (select coalesce(sum(total), 0) from public.sales where status = 'pagada' and (created_at at time zone tz)::date = v_today - 1),
      'series', v_rev
    ),
    'channels', v_channels,
    'appointments', jsonb_build_object(
      'total', (select count(*) from public.appointments where (starts_at at time zone tz)::date = v_today and status::text <> 'cancelada'),
      'done', (select count(*) from public.appointments where (starts_at at time zone tz)::date = v_today and status::text in ('completada', 'atendida'))
    ),
    'surgeries', jsonb_build_object(
      'today', (select count(*) from public.surgeries where (scheduled_at at time zone tz)::date = v_today and status <> 'cancelada'),
      'upcoming', (select count(*) from public.surgeries where status = 'programada' and scheduled_at > now() and scheduled_at <= now() + interval '7 days'),
      'inProgress', (select count(*) from public.surgeries where status = 'en_curso')
    ),
    'admissions', jsonb_build_object(
      'active', (select count(*) from public.admissions where status = 'internado'),
      'capacity', (select count(*) from public.kennels where is_active)
    ),
    'lab', jsonb_build_object('pending', (select count(*) from public.lab_orders where status in ('solicitado', 'muestra_tomada', 'en_proceso'))),
    'stock', jsonb_build_object('low', (select count(*) from public.products where is_active and min_stock > 0 and stock <= min_stock)),
    'patients', jsonb_build_object(
      'total', (select count(*) from public.patients where is_active),
      'new30d', (select count(*) from public.patients where is_active and created_at >= now() - interval '30 days')
    ),
    'agenda', v_agenda,
    'attention', v_attention
  );
end $$;


ALTER FUNCTION "public"."get_admin_overview"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_snapshot"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO ''
    AS $$
declare
  tz         constant text := 'America/Lima';
  today      date := (now() at time zone 'America/Lima')::date;
  week_start date := date_trunc('week', now() at time zone 'America/Lima')::date;
  v_stats    jsonb;
  v_weekly   jsonb;
  v_care     jsonb;
  v_upcoming jsonb;
  v_recent   jsonb;
begin
  v_stats := jsonb_build_array(
    jsonb_build_object('kind', 'patients',
      'value', (select count(*) from public.patients where is_active)),
    jsonb_build_object('kind', 'appointmentsToday',
      'value', (select count(*) from public.appointments
                where (starts_at at time zone tz)::date = today
                  and status::text in ('pendiente', 'confirmada'))),
    jsonb_build_object('kind', 'pendingVaccines',
      'value', (select count(*) from public.vaccinations where applied_at is null)),
    jsonb_build_object('kind', 'productsInStock',
      'value', (select count(*) from public.products where is_active and stock > 0))
  );

  select jsonb_agg(jsonb_build_object('day', d.label, 'total', coalesce(c.total, 0)) order by d.n)
  into v_weekly
  from (values (0, 'Lun'), (1, 'Mar'), (2, 'Mié'), (3, 'Jue'), (4, 'Vie'), (5, 'Sáb'), (6, 'Dom')) as d(n, label)
  left join (
    select ((a.starts_at at time zone tz)::date - week_start) as n, count(*)::int as total
    from public.appointments a
    where (a.starts_at at time zone tz)::date between week_start and week_start + 6
      and a.status::text in ('pendiente', 'confirmada')
    group by 1
  ) c on c.n = d.n;

  select coalesce(jsonb_agg(jsonb_build_object('label', s.label, 'percent', s.pct) order by s.pct desc), '[]'::jsonb)
  into v_care
  from (
    select ct.label, round(100.0 * count(*) / sum(count(*)) over ())::int as pct
    from public.appointments a
    join public.care_types ct on ct.id = a.care_type_id
    where a.status::text in ('pendiente', 'confirmada')
      and a.starts_at >= now() - interval '30 days'
    group by ct.label
  ) s;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', x.id, 'petName', x.pet, 'reason', x.reason,
      'startsAt', x.starts_at, 'status', x.status, 'photoUrl', x.photo_url
    ) order by x.starts_at), '[]'::jsonb)
  into v_upcoming
  from (
    select a.id, p.name as pet, ct.label as reason, a.starts_at, a.status, p.photo_url
    from public.appointments a
    join public.patients p on p.id = a.patient_id
    join public.care_types ct on ct.id = a.care_type_id
    where a.starts_at >= now() and a.status::text in ('pendiente', 'confirmada')
    order by a.starts_at
    limit 5
  ) x;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', x.id, 'name', x.name, 'species', x.species,
      'breed', coalesce(x.breed, 'Sin especificar'),
      'ownerName', x.owner, 'createdAt', x.created_at, 'photoUrl', x.photo_url
    ) order by x.created_at desc), '[]'::jsonb)
  into v_recent
  from (
    select p.id, p.name, p.species, p.breed, o.full_name as owner, p.created_at, p.photo_url
    from public.patients p
    join public.owners o on o.id = p.owner_id
    where p.is_active
    order by p.created_at desc
    limit 5
  ) x;

  return jsonb_build_object(
    'stats', v_stats, 'weekly', v_weekly, 'careTypes', v_care,
    'upcoming', v_upcoming, 'recentPatients', v_recent
  );
end $$;


ALTER FUNCTION "public"."get_dashboard_snapshot"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_patient_options"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
  select jsonb_build_object(
    'species', coalesce((
      select jsonb_agg(e.enumlabel order by e.enumsortorder)
      from pg_catalog.pg_enum e
      where e.enumtypid = (
        select atttypid from pg_catalog.pg_attribute
        where attrelid = 'public.patients'::regclass and attname = 'species')
    ), '[]'::jsonb),
    'sex', coalesce((
      select jsonb_agg(e.enumlabel order by e.enumsortorder)
      from pg_catalog.pg_enum e
      where e.enumtypid = (
        select atttypid from pg_catalog.pg_attribute
        where attrelid = 'public.patients'::regclass and attname = 'sex')
    ), '[]'::jsonb)
  )
$$;


ALTER FUNCTION "public"."get_patient_options"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_audit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.audit_log (actor_id, action, table_name, record_id)
  values ((select auth.uid()), tg_op, tg_table_name,
          case when tg_op = 'DELETE' then to_jsonb(old) ->> 'id' else to_jsonb(new) ->> 'id' end);
  return null;
end $$;


ALTER FUNCTION "public"."log_audit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_patient_weight"("p_patient" "uuid", "p_weight" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare v_role text;
begin
  select p.role::text into v_role from public.profiles p where p.id = auth.uid() and p.is_active;
  if v_role is null or v_role not in ('admin','recepcion','veterinario') then raise exception 'Sin permiso' using errcode = '42501'; end if;
  if p_weight is null or p_weight <= 0 then raise exception 'Peso no válido' using errcode = '22023'; end if;
  insert into public.patient_weights (patient_id, weight_kg, source) values (p_patient, p_weight, 'manual');
  update public.patients set current_weight_kg = p_weight, weight_updated_at = now() where id = p_patient;
end $$;


ALTER FUNCTION "public"."register_patient_weight"("p_patient" "uuid", "p_weight" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_sale"("p_channel" "text", "p_payment_method" "text", "p_owner_id" "uuid", "p_patient_id" "uuid", "p_prescription_id" "uuid", "p_notes" "text", "p_items" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_actor uuid := auth.uid();
    v_role text;
    v_sale_id uuid;
    v_sale_number bigint;
    v_item record;
    v_product public.products;
    v_service public.services;
    v_total numeric := 0;
    v_prescription_patient_id uuid;
    v_prescribed_quantity bigint;
BEGIN
    -- 1. Autenticación y autorización.
    IF v_actor IS NULL THEN
        RAISE EXCEPTION 'Autenticación requerida'
            USING ERRCODE = '42501';
    END IF;

    SELECT p.role::text
      INTO v_role
      FROM public.profiles AS p
     WHERE p.id = v_actor
       AND p.is_active IS TRUE;

    IF v_role IS NULL
       OR v_role NOT IN ('admin', 'recepcion') THEN
        RAISE EXCEPTION 'No tienes permiso para registrar ventas'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Validar canal y medio de pago.
    IF p_channel IS NULL
       OR p_channel NOT IN ('pet_shop', 'farmacia', 'servicios') THEN
        RAISE EXCEPTION 'Canal de venta no válido'
            USING ERRCODE = '22023';
    END IF;

    IF p_payment_method IS NULL
       OR p_payment_method NOT IN (
           'efectivo', 'yape', 'plin', 'tarjeta', 'transferencia'
       ) THEN
        RAISE EXCEPTION 'Método de pago no válido'
            USING ERRCODE = '22023';
    END IF;

    -- 3. Validar el contenido del carrito.
    IF p_items IS NULL
       OR pg_catalog.jsonb_typeof(p_items) <> 'array'
       OR pg_catalog.jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'La venta no tiene ítems'
            USING ERRCODE = '22023';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM pg_catalog.jsonb_array_elements(p_items) AS e
         WHERE COALESCE(
                   NULLIF(e ->> 'quantity', '')::integer, 0
               ) <= 0
            OR pg_catalog.num_nonnulls(
                   NULLIF(e ->> 'product_id', ''),
                   NULLIF(e ->> 'service_id', '')
               ) <> 1
    ) THEN
        RAISE EXCEPTION 'Ítems de venta no válidos'
            USING ERRCODE = '22023';
    END IF;

    -- 4. Si se proporciona una receta, debe existir y pertenecer
    -- al mismo paciente de la venta.
    IF p_prescription_id IS NOT NULL THEN
        SELECT pr.patient_id
          INTO v_prescription_patient_id
          FROM public.prescriptions AS pr
         WHERE pr.id = p_prescription_id
         FOR SHARE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'La receta indicada no existe'
                USING ERRCODE = '22023';
        END IF;

        IF p_patient_id IS NULL
           OR v_prescription_patient_id IS DISTINCT FROM p_patient_id THEN
            RAISE EXCEPTION
                'La receta no corresponde al paciente de la venta'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    -- 5. Crear la venta. Cualquier error posterior revierte
    -- esta inserción junto con los demás cambios de la transacción.
    INSERT INTO public.sales (
        channel,
        payment_method,
        owner_id,
        patient_id,
        prescription_id,
        notes,
        sold_by
    )
    VALUES (
        p_channel,
        p_payment_method,
        p_owner_id,
        p_patient_id,
        p_prescription_id,
        NULLIF(pg_catalog.btrim(p_notes), ''),
        v_actor
    )
    RETURNING id, sale_number
         INTO v_sale_id, v_sale_number;

    -- 6. Agrupar ítems repetidos para validar cantidades y
    -- descontar el inventario de forma consistente.
    FOR v_item IN
        SELECT
            NULLIF(e ->> 'product_id', '')::uuid AS product_id,
            NULLIF(e ->> 'service_id', '')::smallint AS service_id,
            SUM((e ->> 'quantity')::integer)::integer AS qty
        FROM pg_catalog.jsonb_array_elements(p_items) AS e
        GROUP BY 1, 2
        ORDER BY 1 NULLS LAST, 2
    LOOP
        IF v_item.product_id IS NOT NULL THEN
            -- Bloquear el producto para evitar que dos ventas
            -- consuman simultáneamente el mismo stock disponible.
            SELECT *
              INTO v_product
              FROM public.products AS p
             WHERE p.id = v_item.product_id
               AND p.is_active IS TRUE
             FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Producto no disponible'
                    USING ERRCODE = '22023';
            END IF;

            IF v_product.stock < v_item.qty THEN
                RAISE EXCEPTION
                    'Stock insuficiente para %: quedan %',
                    v_product.name, v_product.stock
                    USING ERRCODE = '23514';
            END IF;

            -- Los productos que requieren receta deben estar
            -- incluidos en una receta del paciente de la venta.
            IF v_product.requires_prescription IS TRUE THEN
                IF p_prescription_id IS NULL THEN
                    RAISE EXCEPTION
                        'El producto % requiere receta veterinaria',
                        v_product.name
                        USING ERRCODE = '23514';
                END IF;

                SELECT COALESCE(SUM(pi.quantity), 0)
                  INTO v_prescribed_quantity
                  FROM public.prescription_items AS pi
                 WHERE pi.prescription_id = p_prescription_id
                   AND pi.product_id = v_product.id;

                IF v_prescribed_quantity < v_item.qty THEN
                    RAISE EXCEPTION
                        'La receta no prescribe una cantidad suficiente de %',
                        v_product.name
                        USING ERRCODE = '23514';
                END IF;
            END IF;

            -- Registrar la salida de stock.
            INSERT INTO public.stock_movements (
                product_id, delta, reason, created_by
            )
            VALUES (
                v_product.id,
                -v_item.qty,
                'Venta #' || v_sale_number,
                v_actor
            );

            -- El precio y la descripción provienen de la base de datos.
            INSERT INTO public.sale_items (
                sale_id, product_id, description, quantity, unit_price
            )
            VALUES (
                v_sale_id,
                v_product.id,
                LEFT(v_product.name, 160),
                v_item.qty,
                v_product.price
            );

            v_total := v_total + v_product.price * v_item.qty;

        ELSE
            SELECT *
              INTO v_service
              FROM public.services AS s
             WHERE s.id = v_item.service_id
               AND s.is_active IS TRUE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Servicio no disponible'
                    USING ERRCODE = '22023';
            END IF;

            INSERT INTO public.sale_items (
                sale_id, service_id, description, quantity, unit_price
            )
            VALUES (
                v_sale_id,
                v_service.id,
                LEFT(v_service.name, 160),
                v_item.qty,
                v_service.base_price
            );

            v_total := v_total + v_service.base_price * v_item.qty;
        END IF;
    END LOOP;

    -- 7. Guardar el total calculado por el servidor.
    UPDATE public.sales
       SET total = v_total
     WHERE id = v_sale_id;

    RETURN v_sale_id;
END;
$$;


ALTER FUNCTION "public"."register_sale"("p_channel" "text", "p_payment_method" "text", "p_owner_id" "uuid", "p_patient_id" "uuid", "p_prescription_id" "uuid", "p_notes" "text", "p_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
  tbl name;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        SELECT c.relname INTO tbl FROM pg_catalog.pg_class c WHERE c.oid = cmd.objid;
        EXECUTE format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin new.updated_at = now(); return new; end; $$;


ALTER FUNCTION "public"."touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_consultation_weight"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if new.weight_kg is not null and (tg_op = 'INSERT' or new.weight_kg is distinct from old.weight_kg) then
    insert into public.patient_weights (patient_id, weight_kg, source, consultation_id, recorded_by)
    values (new.patient_id, new.weight_kg, 'consulta', new.id, new.vet_id);
    update public.patients set current_weight_kg = new.weight_kg, weight_updated_at = now() where id = new.patient_id;
  end if;
  return null;
end $$;


ALTER FUNCTION "public"."trg_consultation_weight"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_patient_initial_weight"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if new.weight_kg is not null then
    insert into public.patient_weights (patient_id, weight_kg, source, recorded_by) values (new.id, new.weight_kg, 'registro', new.created_by);
    update public.patients set current_weight_kg = new.weight_kg, weight_updated_at = now() where id = new.id;
  end if;
  return null;
end $$;


ALTER FUNCTION "public"."trg_patient_initial_weight"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."void_sale"("p_sale_id" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."void_sale"("p_sale_id" "uuid", "p_reason" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admission_notes" (
    "id" bigint NOT NULL,
    "admission_id" "uuid" NOT NULL,
    "author_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "note" "text" NOT NULL,
    "weight_kg" numeric,
    "temperature_c" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admission_notes_note_check" CHECK ((("char_length"("btrim"("note")) >= 1) AND ("char_length"("btrim"("note")) <= 2000))),
    CONSTRAINT "admission_notes_temperature_c_check" CHECK ((("temperature_c" >= (30)::numeric) AND ("temperature_c" <= (45)::numeric))),
    CONSTRAINT "admission_notes_weight_kg_check" CHECK (("weight_kg" > (0)::numeric))
);


ALTER TABLE "public"."admission_notes" OWNER TO "postgres";


ALTER TABLE "public"."admission_notes" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."admission_notes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."admissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "kennel_id" smallint NOT NULL,
    "vet_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "diagnosis" "text",
    "status" "text" DEFAULT 'internado'::"text" NOT NULL,
    "admitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "discharged_at" timestamp with time zone,
    "discharge_notes" "text",
    "daily_rate" numeric DEFAULT 0 NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admissions_check" CHECK ((("status" = 'internado'::"text") = ("discharged_at" IS NULL))),
    CONSTRAINT "admissions_daily_rate_check" CHECK (("daily_rate" >= (0)::numeric)),
    CONSTRAINT "admissions_diagnosis_check" CHECK (("char_length"("diagnosis") <= 2000)),
    CONSTRAINT "admissions_discharge_notes_check" CHECK (("char_length"("discharge_notes") <= 2000)),
    CONSTRAINT "admissions_reason_check" CHECK ((("char_length"("btrim"("reason")) >= 1) AND ("char_length"("btrim"("reason")) <= 1000))),
    CONSTRAINT "admissions_status_check" CHECK (("status" = ANY (ARRAY['internado'::"text", 'alta'::"text", 'fallecido'::"text"])))
);


ALTER TABLE "public"."admissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "care_type_id" smallint NOT NULL,
    "vet_id" "uuid",
    "starts_at" timestamp with time zone NOT NULL,
    "status" "public"."appointment_status" DEFAULT 'pendiente'::"public"."appointment_status" NOT NULL,
    "notes" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "appointments_notes_check" CHECK (("char_length"("notes") <= 1000))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" bigint NOT NULL,
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


ALTER TABLE "public"."audit_log" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."audit_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."breeds" (
    "id" bigint NOT NULL,
    "species_id" smallint NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "breeds_name_length_check" CHECK ((("char_length"("btrim"("name")) >= 1) AND ("char_length"("btrim"("name")) <= 80)))
);


ALTER TABLE "public"."breeds" OWNER TO "postgres";


ALTER TABLE "public"."breeds" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."breeds_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."care_types" (
    "id" smallint NOT NULL,
    "label" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "care_types_label_check" CHECK (("char_length"("label") <= 60))
);


ALTER TABLE "public"."care_types" OWNER TO "postgres";


ALTER TABLE "public"."care_types" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."care_types_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."consultations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "appointment_id" "uuid",
    "vet_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "weight_kg" numeric(5,2),
    "temperature_c" numeric(4,1),
    "symptoms" "text",
    "diagnosis" "text",
    "treatment" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "consultations_diagnosis_check" CHECK (("char_length"("diagnosis") <= 2000)),
    CONSTRAINT "consultations_notes_check" CHECK (("char_length"("notes") <= 2000)),
    CONSTRAINT "consultations_symptoms_check" CHECK (("char_length"("symptoms") <= 2000)),
    CONSTRAINT "consultations_temperature_c_check" CHECK ((("temperature_c" >= (30)::numeric) AND ("temperature_c" <= (45)::numeric))),
    CONSTRAINT "consultations_treatment_check" CHECK (("char_length"("treatment") <= 2000)),
    CONSTRAINT "consultations_weight_kg_check" CHECK (("weight_kg" > (0)::numeric))
);


ALTER TABLE "public"."consultations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kennels" (
    "id" smallint NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "kind" "text" DEFAULT 'jaula'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "kennels_code_check" CHECK ((("char_length"("btrim"("code")) >= 1) AND ("char_length"("btrim"("code")) <= 20))),
    CONSTRAINT "kennels_kind_check" CHECK (("kind" = ANY (ARRAY['jaula'::"text", 'cama'::"text", 'aislamiento'::"text"]))),
    CONSTRAINT "kennels_name_check" CHECK ((("char_length"("btrim"("name")) >= 1) AND ("char_length"("btrim"("name")) <= 60)))
);


ALTER TABLE "public"."kennels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lab_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "service_id" smallint NOT NULL,
    "price" numeric DEFAULT 0 NOT NULL,
    "result_value" "text",
    "result_unit" "text",
    "reference_range" "text",
    "result_notes" "text",
    "resulted_by" "uuid",
    "resulted_at" timestamp with time zone,
    CONSTRAINT "lab_order_items_price_check" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "lab_order_items_reference_range_check" CHECK (("char_length"("reference_range") <= 100)),
    CONSTRAINT "lab_order_items_result_notes_check" CHECK (("char_length"("result_notes") <= 1000)),
    CONSTRAINT "lab_order_items_result_unit_check" CHECK (("char_length"("result_unit") <= 40)),
    CONSTRAINT "lab_order_items_result_value_check" CHECK (("char_length"("result_value") <= 500))
);


ALTER TABLE "public"."lab_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lab_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "consultation_id" "uuid",
    "requested_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "status" "text" DEFAULT 'solicitado'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "lab_orders_notes_check" CHECK (("char_length"("notes") <= 1000)),
    CONSTRAINT "lab_orders_status_check" CHECK (("status" = ANY (ARRAY['solicitado'::"text", 'muestra_tomada'::"text", 'en_proceso'::"text", 'completado'::"text", 'cancelado'::"text"])))
);


ALTER TABLE "public"."lab_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "species" "public"."species" NOT NULL,
    "breed" "text",
    "sex" "public"."patient_sex",
    "birth_date" "date",
    "weight_kg" numeric(5,2),
    "microchip" "text",
    "photo_url" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "species_id" smallint,
    "breed_id" bigint,
    "life_status" "text" DEFAULT 'vivo'::"text" NOT NULL,
    "deceased_at" "date",
    "deceased_notes" "text",
    "current_weight_kg" numeric,
    "weight_updated_at" timestamp with time zone,
    "color" "text",
    "is_sterilized" boolean,
    "allergies" "text",
    "notes" "text",
    CONSTRAINT "patients_allergies_check" CHECK (("char_length"("allergies") <= 300)),
    CONSTRAINT "patients_breed_check" CHECK (("char_length"("breed") <= 80)),
    CONSTRAINT "patients_color_check" CHECK (("char_length"("color") <= 40)),
    CONSTRAINT "patients_current_weight_kg_check" CHECK (("current_weight_kg" > (0)::numeric)),
    CONSTRAINT "patients_dead_inactive_chk" CHECK ((("life_status" = 'vivo'::"text") OR ("is_active" = false))),
    CONSTRAINT "patients_deceased_notes_check" CHECK (("char_length"("deceased_notes") <= 500)),
    CONSTRAINT "patients_life_status_check" CHECK (("life_status" = ANY (ARRAY['vivo'::"text", 'fallecido'::"text"]))),
    CONSTRAINT "patients_microchip_check" CHECK (("char_length"("microchip") <= 30)),
    CONSTRAINT "patients_name_check" CHECK ((("char_length"("name") >= 1) AND ("char_length"("name") <= 80))),
    CONSTRAINT "patients_notes_check" CHECK (("char_length"("notes") <= 1000)),
    CONSTRAINT "patients_weight_kg_check" CHECK (("weight_kg" > (0)::numeric))
);


ALTER TABLE "public"."patients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prescription_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prescription_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "dose" "text",
    "frequency" "text",
    "duration_days" integer,
    CONSTRAINT "prescription_items_dose_check" CHECK (("char_length"("dose") <= 200)),
    CONSTRAINT "prescription_items_duration_days_check" CHECK (("duration_days" > 0)),
    CONSTRAINT "prescription_items_frequency_check" CHECK (("char_length"("frequency") <= 100)),
    CONSTRAINT "prescription_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."prescription_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prescriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "consultation_id" "uuid",
    "vet_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "prescriptions_notes_check" CHECK (("char_length"("notes") <= 1000))
);


ALTER TABLE "public"."prescriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sku" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "price" numeric(10,2) NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "min_stock" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category_id" smallint,
    "kind" "text" DEFAULT 'pet_shop'::"text" NOT NULL,
    "requires_prescription" boolean DEFAULT false NOT NULL,
    "description" "text",
    "brand" "text",
    "unit" "text" DEFAULT 'unidad'::"text" NOT NULL,
    "expires_at" "date",
    CONSTRAINT "products_brand_check" CHECK (("char_length"("brand") <= 80)),
    CONSTRAINT "products_category_check" CHECK (("char_length"("category") <= 60)),
    CONSTRAINT "products_description_check" CHECK (("char_length"("description") <= 500)),
    CONSTRAINT "products_kind_check" CHECK (("kind" = ANY (ARRAY['pet_shop'::"text", 'farmacia'::"text", 'insumo'::"text"]))),
    CONSTRAINT "products_min_stock_check" CHECK (("min_stock" >= 0)),
    CONSTRAINT "products_name_check" CHECK ((("char_length"("name") >= 1) AND ("char_length"("name") <= 120))),
    CONSTRAINT "products_price_check" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "products_sku_check" CHECK (("char_length"("sku") <= 40)),
    CONSTRAINT "products_stock_check" CHECK (("stock" >= 0)),
    CONSTRAINT "products_unit_check" CHECK (("char_length"("unit") <= 20))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "job_title" "text",
    "role" "public"."app_role" DEFAULT 'recepcion'::"public"."app_role" NOT NULL,
    "avatar_url" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_full_name_check" CHECK ((("char_length"("full_name") >= 1) AND ("char_length"("full_name") <= 120))),
    CONSTRAINT "profiles_job_title_check" CHECK (("char_length"("job_title") <= 80))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" smallint NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "sample_type" "text",
    "base_price" numeric DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "services_base_price_check" CHECK (("base_price" >= (0)::numeric)),
    CONSTRAINT "services_category_check" CHECK (("category" = ANY (ARRAY['consulta'::"text", 'cirugia'::"text", 'analisis'::"text", 'internamiento'::"text", 'otro'::"text"]))),
    CONSTRAINT "services_code_check" CHECK ((("code" = "lower"("btrim"("code"))) AND (("char_length"("code") >= 2) AND ("char_length"("code") <= 40)))),
    CONSTRAINT "services_name_check" CHECK ((("char_length"("btrim"("name")) >= 2) AND ("char_length"("btrim"("name")) <= 120))),
    CONSTRAINT "services_sample_type_check" CHECK (("char_length"("sample_type") <= 40))
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."surgeries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "appointment_id" "uuid",
    "consultation_id" "uuid",
    "service_id" smallint NOT NULL,
    "surgeon_id" "uuid" NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'programada'::"text" NOT NULL,
    "consent_signed" boolean DEFAULT false NOT NULL,
    "fasting_confirmed" boolean DEFAULT false NOT NULL,
    "pre_op_notes" "text",
    "anesthesia_notes" "text",
    "procedure_notes" "text",
    "post_op_instructions" "text",
    "price" numeric DEFAULT 0 NOT NULL,
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "surgeries_anesthesia_notes_check" CHECK (("char_length"("anesthesia_notes") <= 2000)),
    CONSTRAINT "surgeries_check" CHECK ((("status" <> ALL (ARRAY['en_curso'::"text", 'completada'::"text"])) OR "consent_signed")),
    CONSTRAINT "surgeries_check1" CHECK ((("ended_at" IS NULL) OR ("started_at" IS NULL) OR ("ended_at" >= "started_at"))),
    CONSTRAINT "surgeries_post_op_instructions_check" CHECK (("char_length"("post_op_instructions") <= 2000)),
    CONSTRAINT "surgeries_pre_op_notes_check" CHECK (("char_length"("pre_op_notes") <= 2000)),
    CONSTRAINT "surgeries_price_check" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "surgeries_procedure_notes_check" CHECK (("char_length"("procedure_notes") <= 4000)),
    CONSTRAINT "surgeries_status_check" CHECK (("status" = ANY (ARRAY['programada'::"text", 'en_curso'::"text", 'completada'::"text", 'cancelada'::"text"])))
);


ALTER TABLE "public"."surgeries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vaccinations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "vaccine_id" smallint NOT NULL,
    "due_date" "date" NOT NULL,
    "applied_at" "date",
    "lot" "text",
    "administered_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "vaccinations_lot_check" CHECK (("char_length"("lot") <= 40)),
    CONSTRAINT "vaccinations_notes_check" CHECK (("char_length"("notes") <= 500))
);


ALTER TABLE "public"."vaccinations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vaccines" (
    "id" smallint NOT NULL,
    "name" "text" NOT NULL,
    "interval_days" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "vaccines_interval_days_check" CHECK (("interval_days" > 0)),
    CONSTRAINT "vaccines_name_check" CHECK (("char_length"("name") <= 80))
);


ALTER TABLE "public"."vaccines" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."clinical_history" WITH ("security_invoker"='true') AS
 SELECT "c"."created_at" AS "occurred_at",
    'Consulta'::"text" AS "record_type",
    "c"."patient_id",
    "p"."name" AS "patient_name",
    COALESCE(NULLIF("btrim"("c"."diagnosis"), ''::"text"), 'Consulta clínica'::"text") AS "title",
    NULLIF("concat_ws"(' · '::"text", ('Síntomas: '::"text" || NULLIF("c"."symptoms", ''::"text")), ('Tratamiento: '::"text" || NULLIF("c"."treatment", ''::"text"))), ''::"text") AS "detail",
    NULL::"text" AS "status",
    "pr"."full_name" AS "author_name",
    'consultations'::"text" AS "source_table",
    ("c"."id")::"text" AS "source_id"
   FROM (("public"."consultations" "c"
     JOIN "public"."patients" "p" ON (("p"."id" = "c"."patient_id")))
     LEFT JOIN "public"."profiles" "pr" ON (("pr"."id" = "c"."vet_id")))
UNION ALL
 SELECT COALESCE((("v"."applied_at")::timestamp without time zone AT TIME ZONE 'America/Lima'::"text"), "v"."created_at") AS "occurred_at",
    'Vacunación'::"text" AS "record_type",
    "v"."patient_id",
    "p"."name" AS "patient_name",
    "vc"."name" AS "title",
    NULLIF("concat_ws"(' · '::"text", ('Lote: '::"text" || NULLIF("v"."lot", ''::"text")), ('Próxima dosis: '::"text" || "to_char"(("v"."due_date")::timestamp with time zone, 'DD/MM/YYYY'::"text"))), ''::"text") AS "detail",
        CASE
            WHEN ("v"."applied_at" IS NULL) THEN 'pendiente'::"text"
            ELSE 'aplicada'::"text"
        END AS "status",
    "pr"."full_name" AS "author_name",
    'vaccinations'::"text" AS "source_table",
    ("v"."id")::"text" AS "source_id"
   FROM ((("public"."vaccinations" "v"
     JOIN "public"."patients" "p" ON (("p"."id" = "v"."patient_id")))
     JOIN "public"."vaccines" "vc" ON (("vc"."id" = "v"."vaccine_id")))
     LEFT JOIN "public"."profiles" "pr" ON (("pr"."id" = "v"."administered_by")))
UNION ALL
 SELECT COALESCE("s"."started_at", "s"."scheduled_at") AS "occurred_at",
    'Cirugía'::"text" AS "record_type",
    "s"."patient_id",
    "p"."name" AS "patient_name",
    "sv"."name" AS "title",
    NULLIF("concat_ws"(' · '::"text", NULLIF("s"."procedure_notes", ''::"text"), NULLIF("s"."post_op_instructions", ''::"text")), ''::"text") AS "detail",
    "s"."status",
    "pr"."full_name" AS "author_name",
    'surgeries'::"text" AS "source_table",
    ("s"."id")::"text" AS "source_id"
   FROM ((("public"."surgeries" "s"
     JOIN "public"."patients" "p" ON (("p"."id" = "s"."patient_id")))
     JOIN "public"."services" "sv" ON (("sv"."id" = "s"."service_id")))
     LEFT JOIN "public"."profiles" "pr" ON (("pr"."id" = "s"."surgeon_id")))
UNION ALL
 SELECT "o"."created_at" AS "occurred_at",
    'Análisis'::"text" AS "record_type",
    "o"."patient_id",
    "p"."name" AS "patient_name",
    COALESCE(( SELECT "string_agg"("sv"."name", ', '::"text" ORDER BY "sv"."name") AS "string_agg"
           FROM ("public"."lab_order_items" "i"
             JOIN "public"."services" "sv" ON (("sv"."id" = "i"."service_id")))
          WHERE ("i"."order_id" = "o"."id")), 'Orden de análisis'::"text") AS "title",
    NULLIF("o"."notes", ''::"text") AS "detail",
    "o"."status",
    "pr"."full_name" AS "author_name",
    'lab_orders'::"text" AS "source_table",
    ("o"."id")::"text" AS "source_id"
   FROM (("public"."lab_orders" "o"
     JOIN "public"."patients" "p" ON (("p"."id" = "o"."patient_id")))
     LEFT JOIN "public"."profiles" "pr" ON (("pr"."id" = "o"."requested_by")))
UNION ALL
 SELECT "a"."admitted_at" AS "occurred_at",
    'Internamiento'::"text" AS "record_type",
    "a"."patient_id",
    "p"."name" AS "patient_name",
    ('Internamiento en '::"text" || "k"."name") AS "title",
    NULLIF("concat_ws"(' · '::"text", "a"."reason", ('Alta: '::"text" || NULLIF("a"."discharge_notes", ''::"text"))), ''::"text") AS "detail",
    "a"."status",
    "pr"."full_name" AS "author_name",
    'admissions'::"text" AS "source_table",
    ("a"."id")::"text" AS "source_id"
   FROM ((("public"."admissions" "a"
     JOIN "public"."patients" "p" ON (("p"."id" = "a"."patient_id")))
     JOIN "public"."kennels" "k" ON (("k"."id" = "a"."kennel_id")))
     LEFT JOIN "public"."profiles" "pr" ON (("pr"."id" = "a"."vet_id")))
UNION ALL
 SELECT "rx"."created_at" AS "occurred_at",
    'Receta'::"text" AS "record_type",
    "rx"."patient_id",
    "p"."name" AS "patient_name",
    'Receta médica'::"text" AS "title",
    COALESCE(( SELECT "string_agg"((("pd"."name" || ' x'::"text") || "ri"."quantity"), ', '::"text" ORDER BY "pd"."name") AS "string_agg"
           FROM ("public"."prescription_items" "ri"
             JOIN "public"."products" "pd" ON (("pd"."id" = "ri"."product_id")))
          WHERE ("ri"."prescription_id" = "rx"."id")), NULLIF("rx"."notes", ''::"text")) AS "detail",
    NULL::"text" AS "status",
    "pr"."full_name" AS "author_name",
    'prescriptions'::"text" AS "source_table",
    ("rx"."id")::"text" AS "source_id"
   FROM (("public"."prescriptions" "rx"
     JOIN "public"."patients" "p" ON (("p"."id" = "rx"."patient_id")))
     LEFT JOIN "public"."profiles" "pr" ON (("pr"."id" = "rx"."vet_id")));


ALTER VIEW "public"."clinical_history" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."kennel_occupancy" AS
 SELECT "k"."id",
    "k"."code",
    "k"."name",
    "k"."kind",
    "a"."id" AS "admission_id",
    "p"."name" AS "patient_name",
    "a"."admitted_at"
   FROM (("public"."kennels" "k"
     LEFT JOIN "public"."admissions" "a" ON ((("a"."kennel_id" = "k"."id") AND ("a"."status" = 'internado'::"text"))))
     LEFT JOIN "public"."patients" "p" ON (("p"."id" = "a"."patient_id")))
  WHERE ("k"."is_active" AND (( SELECT ("public"."auth_role"())::"text" AS "auth_role") = ANY (ARRAY['admin'::"text", 'veterinario'::"text", 'recepcion'::"text"])));


ALTER VIEW "public"."kennel_occupancy" OWNER TO "postgres";


ALTER TABLE "public"."kennels" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."kennels_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."owners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "document_number" "text",
    "address" "text",
    "notes" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "owners_address_check" CHECK (("char_length"("address") <= 200)),
    CONSTRAINT "owners_document_number_check" CHECK (("char_length"("document_number") <= 20)),
    CONSTRAINT "owners_email_check" CHECK (("char_length"("email") <= 160)),
    CONSTRAINT "owners_full_name_check" CHECK ((("char_length"("full_name") >= 2) AND ("char_length"("full_name") <= 120))),
    CONSTRAINT "owners_notes_check" CHECK (("char_length"("notes") <= 1000)),
    CONSTRAINT "owners_phone_check" CHECK (("char_length"("phone") <= 30))
);


ALTER TABLE "public"."owners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_weights" (
    "id" bigint NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "weight_kg" numeric NOT NULL,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "consultation_id" "uuid",
    "recorded_by" "uuid" DEFAULT "auth"."uid"(),
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "patient_weights_source_check" CHECK (("source" = ANY (ARRAY['registro'::"text", 'consulta'::"text", 'manual'::"text"]))),
    CONSTRAINT "patient_weights_weight_kg_check" CHECK (("weight_kg" > (0)::numeric))
);


ALTER TABLE "public"."patient_weights" OWNER TO "postgres";


ALTER TABLE "public"."patient_weights" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."patient_weights_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."product_categories" (
    "id" smallint NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "product_categories_name_length_check" CHECK ((("char_length"("btrim"("name")) >= 1) AND ("char_length"("btrim"("name")) <= 60)))
);


ALTER TABLE "public"."product_categories" OWNER TO "postgres";


ALTER TABLE "public"."product_categories" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."product_categories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."sale_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sale_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "service_id" smallint,
    "description" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric NOT NULL,
    "subtotal" numeric GENERATED ALWAYS AS ((("quantity")::numeric * "unit_price")) STORED,
    CONSTRAINT "sale_items_check" CHECK (("num_nonnulls"("product_id", "service_id") = 1)),
    CONSTRAINT "sale_items_description_check" CHECK (("char_length"("description") <= 160)),
    CONSTRAINT "sale_items_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "sale_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."sale_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sale_number" bigint NOT NULL,
    "channel" "text" NOT NULL,
    "owner_id" "uuid",
    "patient_id" "uuid",
    "prescription_id" "uuid",
    "payment_method" "text" NOT NULL,
    "status" "text" DEFAULT 'pagada'::"text" NOT NULL,
    "total" numeric DEFAULT 0 NOT NULL,
    "notes" "text",
    "sold_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "voided_at" timestamp with time zone,
    "voided_by" "uuid",
    "void_reason" "text",
    CONSTRAINT "sales_channel_check" CHECK (("channel" = ANY (ARRAY['pet_shop'::"text", 'farmacia'::"text", 'servicios'::"text"]))),
    CONSTRAINT "sales_check" CHECK ((("status" = 'anulada'::"text") = ("voided_at" IS NOT NULL))),
    CONSTRAINT "sales_notes_check" CHECK (("char_length"("notes") <= 500)),
    CONSTRAINT "sales_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['efectivo'::"text", 'yape'::"text", 'plin'::"text", 'tarjeta'::"text", 'transferencia'::"text"]))),
    CONSTRAINT "sales_status_check" CHECK (("status" = ANY (ARRAY['pagada'::"text", 'anulada'::"text"]))),
    CONSTRAINT "sales_total_check" CHECK (("total" >= (0)::numeric)),
    CONSTRAINT "sales_void_reason_check" CHECK (("char_length"("void_reason") <= 300))
);


ALTER TABLE "public"."sales" OWNER TO "postgres";


ALTER TABLE "public"."sales" ALTER COLUMN "sale_number" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."sales_sale_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."services" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."services_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."species_catalog" (
    "id" smallint NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "species_catalog_code_format_check" CHECK ((("code" = "lower"("btrim"("code"))) AND (("char_length"("code") >= 2) AND ("char_length"("code") <= 30)))),
    CONSTRAINT "species_catalog_name_length_check" CHECK ((("char_length"("btrim"("name")) >= 2) AND ("char_length"("btrim"("name")) <= 80)))
);


ALTER TABLE "public"."species_catalog" OWNER TO "postgres";


ALTER TABLE "public"."species_catalog" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."species_catalog_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."stock_movements" (
    "id" bigint NOT NULL,
    "product_id" "uuid" NOT NULL,
    "delta" integer NOT NULL,
    "reason" "text" NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "stock_movements_delta_check" CHECK (("delta" <> 0)),
    CONSTRAINT "stock_movements_reason_check" CHECK ((("char_length"("reason") >= 1) AND ("char_length"("reason") <= 200)))
);


ALTER TABLE "public"."stock_movements" OWNER TO "postgres";


ALTER TABLE "public"."stock_movements" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."stock_movements_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."vaccines" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."vaccines_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."admission_notes"
    ADD CONSTRAINT "admission_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admissions"
    ADD CONSTRAINT "admissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."breeds"
    ADD CONSTRAINT "breeds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."care_types"
    ADD CONSTRAINT "care_types_label_key" UNIQUE ("label");



ALTER TABLE ONLY "public"."care_types"
    ADD CONSTRAINT "care_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consultations"
    ADD CONSTRAINT "consultations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kennels"
    ADD CONSTRAINT "kennels_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."kennels"
    ADD CONSTRAINT "kennels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lab_order_items"
    ADD CONSTRAINT "lab_order_items_order_id_service_id_key" UNIQUE ("order_id", "service_id");



ALTER TABLE ONLY "public"."lab_order_items"
    ADD CONSTRAINT "lab_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lab_orders"
    ADD CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_weights"
    ADD CONSTRAINT "patient_weights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_microchip_key" UNIQUE ("microchip");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescription_items"
    ADD CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_sale_number_key" UNIQUE ("sale_number");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."species_catalog"
    ADD CONSTRAINT "species_catalog_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."species_catalog"
    ADD CONSTRAINT "species_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."surgeries"
    ADD CONSTRAINT "surgeries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vaccinations"
    ADD CONSTRAINT "vaccinations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vaccines"
    ADD CONSTRAINT "vaccines_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."vaccines"
    ADD CONSTRAINT "vaccines_pkey" PRIMARY KEY ("id");



CREATE INDEX "admission_notes_adm_idx" ON "public"."admission_notes" USING "btree" ("admission_id", "created_at" DESC);



CREATE UNIQUE INDEX "admissions_one_active_per_kennel" ON "public"."admissions" USING "btree" ("kennel_id") WHERE ("status" = 'internado'::"text");



CREATE UNIQUE INDEX "admissions_one_active_per_patient" ON "public"."admissions" USING "btree" ("patient_id") WHERE ("status" = 'internado'::"text");



CREATE INDEX "admissions_patient_idx" ON "public"."admissions" USING "btree" ("patient_id", "admitted_at" DESC);



CREATE INDEX "appointments_patient_idx" ON "public"."appointments" USING "btree" ("patient_id");



CREATE INDEX "appointments_starts_idx" ON "public"."appointments" USING "btree" ("starts_at");



CREATE INDEX "audit_log_created_idx" ON "public"."audit_log" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "breeds_species_normalized_name_uidx" ON "public"."breeds" USING "btree" ("species_id", "lower"("btrim"("name")));



CREATE INDEX "consultations_patient_idx" ON "public"."consultations" USING "btree" ("patient_id", "created_at" DESC);



CREATE INDEX "lab_order_items_order_idx" ON "public"."lab_order_items" USING "btree" ("order_id");



CREATE INDEX "lab_orders_patient_idx" ON "public"."lab_orders" USING "btree" ("patient_id", "created_at" DESC);



CREATE INDEX "patient_weights_patient_idx" ON "public"."patient_weights" USING "btree" ("patient_id", "recorded_at" DESC);



CREATE INDEX "patients_breed_id_idx" ON "public"."patients" USING "btree" ("breed_id");



CREATE INDEX "patients_created_idx" ON "public"."patients" USING "btree" ("created_at" DESC);



CREATE INDEX "patients_owner_idx" ON "public"."patients" USING "btree" ("owner_id");



CREATE INDEX "patients_species_id_idx" ON "public"."patients" USING "btree" ("species_id");



CREATE INDEX "prescription_items_rx_idx" ON "public"."prescription_items" USING "btree" ("prescription_id");



CREATE INDEX "prescriptions_patient_idx" ON "public"."prescriptions" USING "btree" ("patient_id", "created_at" DESC);



CREATE INDEX "products_category_id_idx" ON "public"."products" USING "btree" ("category_id");



CREATE INDEX "products_kind_idx" ON "public"."products" USING "btree" ("kind") WHERE "is_active";



CREATE INDEX "sale_items_sale_idx" ON "public"."sale_items" USING "btree" ("sale_id");



CREATE INDEX "sales_created_idx" ON "public"."sales" USING "btree" ("created_at" DESC);



CREATE INDEX "stock_movements_product_idx" ON "public"."stock_movements" USING "btree" ("product_id", "created_at" DESC);



CREATE INDEX "surgeries_patient_idx" ON "public"."surgeries" USING "btree" ("patient_id", "scheduled_at" DESC);



CREATE INDEX "surgeries_surgeon_idx" ON "public"."surgeries" USING "btree" ("surgeon_id", "scheduled_at");



CREATE INDEX "vaccinations_patient_idx" ON "public"."vaccinations" USING "btree" ("patient_id");



CREATE INDEX "vaccinations_pending_idx" ON "public"."vaccinations" USING "btree" ("due_date") WHERE ("applied_at" IS NULL);



CREATE OR REPLACE TRIGGER "admissions_touch" BEFORE UPDATE ON "public"."admissions" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "appointments_updated_at" BEFORE UPDATE ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();



CREATE OR REPLACE TRIGGER "audit_admissions" AFTER INSERT OR DELETE OR UPDATE ON "public"."admissions" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit"();



CREATE OR REPLACE TRIGGER "audit_appointments" AFTER INSERT OR DELETE OR UPDATE ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit"();



CREATE OR REPLACE TRIGGER "audit_consultations" AFTER INSERT OR DELETE OR UPDATE ON "public"."consultations" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit"();



CREATE OR REPLACE TRIGGER "audit_lab_orders" AFTER INSERT OR DELETE OR UPDATE ON "public"."lab_orders" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit"();



CREATE OR REPLACE TRIGGER "audit_owners" AFTER INSERT OR DELETE OR UPDATE ON "public"."owners" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit"();



CREATE OR REPLACE TRIGGER "audit_patients" AFTER INSERT OR DELETE OR UPDATE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit"();



CREATE OR REPLACE TRIGGER "audit_prescriptions" AFTER INSERT OR DELETE OR UPDATE ON "public"."prescriptions" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit"();



CREATE OR REPLACE TRIGGER "audit_products" AFTER INSERT OR DELETE OR UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit"();



CREATE OR REPLACE TRIGGER "audit_sales" AFTER INSERT OR DELETE OR UPDATE ON "public"."sales" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit"();



CREATE OR REPLACE TRIGGER "audit_surgeries" AFTER INSERT OR DELETE OR UPDATE ON "public"."surgeries" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit"();



CREATE OR REPLACE TRIGGER "audit_vaccinations" AFTER INSERT OR DELETE OR UPDATE ON "public"."vaccinations" FOR EACH ROW EXECUTE FUNCTION "public"."log_audit"();



CREATE OR REPLACE TRIGGER "consultation_weight" AFTER INSERT OR UPDATE OF "weight_kg" ON "public"."consultations" FOR EACH ROW EXECUTE FUNCTION "public"."trg_consultation_weight"();



CREATE OR REPLACE TRIGGER "consultations_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."consultations" FOR EACH ROW EXECUTE FUNCTION "private"."log_change"();



CREATE OR REPLACE TRIGGER "consultations_updated_at" BEFORE UPDATE ON "public"."consultations" FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();



CREATE OR REPLACE TRIGGER "lab_orders_touch" BEFORE UPDATE ON "public"."lab_orders" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "owners_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."owners" FOR EACH ROW EXECUTE FUNCTION "private"."log_change"();



CREATE OR REPLACE TRIGGER "owners_updated_at" BEFORE UPDATE ON "public"."owners" FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();



CREATE OR REPLACE TRIGGER "patient_initial_weight" AFTER INSERT ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."trg_patient_initial_weight"();



CREATE OR REPLACE TRIGGER "patients_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "private"."log_change"();



CREATE OR REPLACE TRIGGER "patients_updated_at" BEFORE UPDATE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();



CREATE OR REPLACE TRIGGER "prescriptions_touch" BEFORE UPDATE ON "public"."prescriptions" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "private"."log_change"();



CREATE OR REPLACE TRIGGER "profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();



CREATE OR REPLACE TRIGGER "stock_movements_apply" AFTER INSERT ON "public"."stock_movements" FOR EACH ROW EXECUTE FUNCTION "public"."apply_stock_movement"();



CREATE OR REPLACE TRIGGER "surgeries_touch" BEFORE UPDATE ON "public"."surgeries" FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "vaccinations_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."vaccinations" FOR EACH ROW EXECUTE FUNCTION "private"."log_change"();



CREATE OR REPLACE TRIGGER "vaccinations_updated_at" BEFORE UPDATE ON "public"."vaccinations" FOR EACH ROW EXECUTE FUNCTION "private"."set_updated_at"();



ALTER TABLE ONLY "public"."admission_notes"
    ADD CONSTRAINT "admission_notes_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "public"."admissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admission_notes"
    ADD CONSTRAINT "admission_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."admissions"
    ADD CONSTRAINT "admissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."admissions"
    ADD CONSTRAINT "admissions_kennel_id_fkey" FOREIGN KEY ("kennel_id") REFERENCES "public"."kennels"("id");



ALTER TABLE ONLY "public"."admissions"
    ADD CONSTRAINT "admissions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."admissions"
    ADD CONSTRAINT "admissions_vet_id_fkey" FOREIGN KEY ("vet_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_care_type_id_fkey" FOREIGN KEY ("care_type_id") REFERENCES "public"."care_types"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_vet_id_fkey" FOREIGN KEY ("vet_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."breeds"
    ADD CONSTRAINT "breeds_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "public"."species_catalog"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."consultations"
    ADD CONSTRAINT "consultations_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."consultations"
    ADD CONSTRAINT "consultations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."consultations"
    ADD CONSTRAINT "consultations_vet_id_fkey" FOREIGN KEY ("vet_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."lab_order_items"
    ADD CONSTRAINT "lab_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."lab_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_order_items"
    ADD CONSTRAINT "lab_order_items_resulted_by_fkey" FOREIGN KEY ("resulted_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."lab_order_items"
    ADD CONSTRAINT "lab_order_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id");



ALTER TABLE ONLY "public"."lab_orders"
    ADD CONSTRAINT "lab_orders_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id");



ALTER TABLE ONLY "public"."lab_orders"
    ADD CONSTRAINT "lab_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."lab_orders"
    ADD CONSTRAINT "lab_orders_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."owners"
    ADD CONSTRAINT "owners_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."patient_weights"
    ADD CONSTRAINT "patient_weights_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."patient_weights"
    ADD CONSTRAINT "patient_weights_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_weights"
    ADD CONSTRAINT "patient_weights_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_breed_id_fkey" FOREIGN KEY ("breed_id") REFERENCES "public"."breeds"("id") ON DELETE RESTRICT NOT VALID;



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "public"."species_catalog"("id") ON DELETE RESTRICT NOT VALID;



ALTER TABLE ONLY "public"."prescription_items"
    ADD CONSTRAINT "prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prescription_items"
    ADD CONSTRAINT "prescription_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id");



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."prescriptions"
    ADD CONSTRAINT "prescriptions_vet_id_fkey" FOREIGN KEY ("vet_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE RESTRICT NOT VALID;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_sold_by_fkey" FOREIGN KEY ("sold_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_voided_by_fkey" FOREIGN KEY ("voided_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."surgeries"
    ADD CONSTRAINT "surgeries_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id");



ALTER TABLE ONLY "public"."surgeries"
    ADD CONSTRAINT "surgeries_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id");



ALTER TABLE ONLY "public"."surgeries"
    ADD CONSTRAINT "surgeries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."surgeries"
    ADD CONSTRAINT "surgeries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."surgeries"
    ADD CONSTRAINT "surgeries_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id");



ALTER TABLE ONLY "public"."surgeries"
    ADD CONSTRAINT "surgeries_surgeon_id_fkey" FOREIGN KEY ("surgeon_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."vaccinations"
    ADD CONSTRAINT "vaccinations_administered_by_fkey" FOREIGN KEY ("administered_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vaccinations"
    ADD CONSTRAINT "vaccinations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."vaccinations"
    ADD CONSTRAINT "vaccinations_vaccine_id_fkey" FOREIGN KEY ("vaccine_id") REFERENCES "public"."vaccines"("id");



ALTER TABLE "public"."admission_notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admission_notes_delete" ON "public"."admission_notes" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "admission_notes_insert" ON "public"."admission_notes" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



CREATE POLICY "admission_notes_select" ON "public"."admission_notes" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



CREATE POLICY "admission_notes_update" ON "public"."admission_notes" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



ALTER TABLE "public"."admissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admissions_delete" ON "public"."admissions" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "admissions_insert" ON "public"."admissions" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



CREATE POLICY "admissions_select" ON "public"."admissions" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



CREATE POLICY "admissions_update" ON "public"."admissions" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "appointments_delete" ON "public"."appointments" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "appointments_insert" ON "public"."appointments" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,recepcion}'::"text"[])));



CREATE POLICY "appointments_select" ON "public"."appointments" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario,recepcion}'::"text"[])));



CREATE POLICY "appointments_update" ON "public"."appointments" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario,recepcion}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario,recepcion}'::"text"[])));



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_log_select" ON "public"."audit_log" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



ALTER TABLE "public"."breeds" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "breeds_delete" ON "public"."breeds" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "breeds_insert" ON "public"."breeds" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "breeds_select" ON "public"."breeds" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario,recepcion}'::"text"[])));



CREATE POLICY "breeds_update" ON "public"."breeds" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



ALTER TABLE "public"."care_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "care_types_delete" ON "public"."care_types" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "care_types_insert" ON "public"."care_types" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "care_types_select" ON "public"."care_types" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario,recepcion}'::"text"[])));



CREATE POLICY "care_types_update" ON "public"."care_types" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



ALTER TABLE "public"."consultations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "consultations_delete" ON "public"."consultations" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "consultations_insert" ON "public"."consultations" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



CREATE POLICY "consultations_select" ON "public"."consultations" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



CREATE POLICY "consultations_update" ON "public"."consultations" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



ALTER TABLE "public"."kennels" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "kennels_delete" ON "public"."kennels" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "kennels_insert" ON "public"."kennels" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "kennels_select" ON "public"."kennels" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario,recepcion}'::"text"[])));



CREATE POLICY "kennels_update" ON "public"."kennels" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



ALTER TABLE "public"."lab_order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lab_order_items_delete" ON "public"."lab_order_items" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "lab_order_items_insert" ON "public"."lab_order_items" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



CREATE POLICY "lab_order_items_select" ON "public"."lab_order_items" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



CREATE POLICY "lab_order_items_update" ON "public"."lab_order_items" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



ALTER TABLE "public"."lab_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lab_orders_delete" ON "public"."lab_orders" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "lab_orders_insert" ON "public"."lab_orders" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



CREATE POLICY "lab_orders_select" ON "public"."lab_orders" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario,recepcion}'::"text"[])));



CREATE POLICY "lab_orders_update" ON "public"."lab_orders" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



ALTER TABLE "public"."owners" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owners_delete" ON "public"."owners" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "owners_insert" ON "public"."owners" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,recepcion}'::"text"[])));



CREATE POLICY "owners_select" ON "public"."owners" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario,recepcion}'::"text"[])));



CREATE POLICY "owners_update" ON "public"."owners" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,recepcion}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,recepcion}'::"text"[])));



ALTER TABLE "public"."patient_weights" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patient_weights_select" ON "public"."patient_weights" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND "p"."is_active"))));



ALTER TABLE "public"."patients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patients_delete" ON "public"."patients" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "patients_insert" ON "public"."patients" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,recepcion}'::"text"[])));



CREATE POLICY "patients_select" ON "public"."patients" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario,recepcion}'::"text"[])));



CREATE POLICY "patients_update" ON "public"."patients" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,recepcion}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,recepcion}'::"text"[])));



ALTER TABLE "public"."prescription_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "prescription_items_delete" ON "public"."prescription_items" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "prescription_items_insert" ON "public"."prescription_items" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



CREATE POLICY "prescription_items_select" ON "public"."prescription_items" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario,recepcion}'::"text"[])));



CREATE POLICY "prescription_items_update" ON "public"."prescription_items" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



ALTER TABLE "public"."prescriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "prescriptions_delete" ON "public"."prescriptions" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "prescriptions_insert" ON "public"."prescriptions" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



CREATE POLICY "prescriptions_select" ON "public"."prescriptions" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario,recepcion}'::"text"[])));



CREATE POLICY "prescriptions_update" ON "public"."prescriptions" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



ALTER TABLE "public"."product_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_categories_delete" ON "public"."product_categories" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "product_categories_insert" ON "public"."product_categories" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "product_categories_select" ON "public"."product_categories" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario,recepcion}'::"text"[])));



CREATE POLICY "product_categories_update" ON "public"."product_categories" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_delete" ON "public"."products" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = 'admin'::"text"));



CREATE POLICY "products_insert" ON "public"."products" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY (ARRAY['admin'::"text", 'recepcion'::"text"])));



CREATE POLICY "products_select" ON "public"."products" FOR SELECT TO "authenticated" USING ((((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY (ARRAY['admin'::"text", 'recepcion'::"text"])) OR (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = 'veterinario'::"text") AND ("kind" = 'farmacia'::"text"))));



CREATE POLICY "products_update" ON "public"."products" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY (ARRAY['admin'::"text", 'recepcion'::"text"]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY (ARRAY['admin'::"text", 'recepcion'::"text"])));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "public"."auth_role"() AS "auth_role") IS NOT NULL));



CREATE POLICY "profiles_update_admin" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = 'admin'::"text")) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = 'admin'::"text"));



CREATE POLICY "profiles_update_self" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((("id" = ( SELECT "auth"."uid"() AS "uid")) AND ("role" = ( SELECT "public"."auth_role"() AS "auth_role")) AND "is_active"));



ALTER TABLE "public"."sale_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sale_items_select" ON "public"."sale_items" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,recepcion}'::"text"[])));



ALTER TABLE "public"."sales" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sales_select" ON "public"."sales" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,recepcion}'::"text"[])));



ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "services_delete" ON "public"."services" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "services_insert" ON "public"."services" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "services_select" ON "public"."services" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario,recepcion}'::"text"[])));



CREATE POLICY "services_update" ON "public"."services" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



ALTER TABLE "public"."species_catalog" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "species_catalog_delete" ON "public"."species_catalog" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "species_catalog_insert" ON "public"."species_catalog" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "species_catalog_select" ON "public"."species_catalog" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario,recepcion}'::"text"[])));



CREATE POLICY "species_catalog_update" ON "public"."species_catalog" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



ALTER TABLE "public"."stock_movements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stock_movements_insert" ON "public"."stock_movements" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,recepcion}'::"text"[])));



CREATE POLICY "stock_movements_select" ON "public"."stock_movements" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,recepcion}'::"text"[])));



ALTER TABLE "public"."surgeries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "surgeries_delete" ON "public"."surgeries" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "surgeries_insert" ON "public"."surgeries" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



CREATE POLICY "surgeries_select" ON "public"."surgeries" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



CREATE POLICY "surgeries_update" ON "public"."surgeries" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



ALTER TABLE "public"."vaccinations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vaccinations_delete" ON "public"."vaccinations" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "vaccinations_insert" ON "public"."vaccinations" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



CREATE POLICY "vaccinations_select" ON "public"."vaccinations" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario,recepcion}'::"text"[])));



CREATE POLICY "vaccinations_update" ON "public"."vaccinations" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario}'::"text"[])));



ALTER TABLE "public"."vaccines" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vaccines_delete" ON "public"."vaccines" FOR DELETE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "vaccines_insert" ON "public"."vaccines" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));



CREATE POLICY "vaccines_select" ON "public"."vaccines" FOR SELECT TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin,veterinario,recepcion}'::"text"[])));



CREATE POLICY "vaccines_update" ON "public"."vaccines" FOR UPDATE TO "authenticated" USING (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[]))) WITH CHECK (((( SELECT "public"."auth_role"() AS "auth_role"))::"text" = ANY ('{admin}'::"text"[])));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "private" TO "authenticated";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "private"."apply_policies"("tbl" "regclass", "read_roles" "text"[], "write_roles" "text"[], "delete_roles" "text"[], "allow_update" boolean) FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."apply_stock_movement"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."current_app_role"() FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."current_app_role"() TO "authenticated";



REVOKE ALL ON FUNCTION "private"."handle_new_user"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."has_role"("roles" "public"."app_role"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."has_role"("roles" "public"."app_role"[]) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."log_change"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."set_updated_at"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."add_patient_to_owner"("p_owner_id" "uuid", "p_patient" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_patient_to_owner"("p_owner_id" "uuid", "p_patient" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_patient_to_owner"("p_owner_id" "uuid", "p_patient" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_set_profile"("target" "uuid", "new_role" "public"."app_role", "new_active" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_set_profile"("target" "uuid", "new_role" "public"."app_role", "new_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_set_profile"("target" "uuid", "new_role" "public"."app_role", "new_active" boolean) TO "service_role";



REVOKE ALL ON FUNCTION "public"."apply_stock_movement"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."apply_stock_movement"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."auth_role"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."auth_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_role"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_lab_order"("p_patient_id" "uuid", "p_service_ids" integer[], "p_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_lab_order"("p_patient_id" "uuid", "p_service_ids" integer[], "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_lab_order"("p_patient_id" "uuid", "p_service_ids" integer[], "p_notes" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_patient_with_owner"("p_owner" "jsonb", "p_patient" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_patient_with_owner"("p_owner" "jsonb", "p_patient" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_patient_with_owner"("p_owner" "jsonb", "p_patient" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_set_updated_at"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."fn_update_product_stock"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."get_admin_overview"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_overview"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_overview"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_dashboard_snapshot"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_dashboard_snapshot"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_snapshot"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_patient_options"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_patient_options"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_patient_options"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."log_audit"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_audit"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."register_patient_weight"("p_patient" "uuid", "p_weight" numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."register_patient_weight"("p_patient" "uuid", "p_weight" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_patient_weight"("p_patient" "uuid", "p_weight" numeric) TO "service_role";



REVOKE ALL ON FUNCTION "public"."register_sale"("p_channel" "text", "p_payment_method" "text", "p_owner_id" "uuid", "p_patient_id" "uuid", "p_prescription_id" "uuid", "p_notes" "text", "p_items" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."register_sale"("p_channel" "text", "p_payment_method" "text", "p_owner_id" "uuid", "p_patient_id" "uuid", "p_prescription_id" "uuid", "p_notes" "text", "p_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_sale"("p_channel" "text", "p_payment_method" "text", "p_owner_id" "uuid", "p_patient_id" "uuid", "p_prescription_id" "uuid", "p_notes" "text", "p_items" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."touch_updated_at"() FROM PUBLIC;



GRANT ALL ON FUNCTION "public"."trg_consultation_weight"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_consultation_weight"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_patient_initial_weight"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_patient_initial_weight"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."void_sale"("p_sale_id" "uuid", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."void_sale"("p_sale_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."void_sale"("p_sale_id" "uuid", "p_reason" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."admission_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."admission_notes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."admission_notes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."admission_notes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."admissions" TO "authenticated";
GRANT ALL ON TABLE "public"."admissions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,MAINTAIN,UPDATE ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,MAINTAIN,UPDATE ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."breeds" TO "authenticated";
GRANT ALL ON TABLE "public"."breeds" TO "service_role";



GRANT ALL ON SEQUENCE "public"."breeds_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."breeds_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,MAINTAIN,UPDATE ON TABLE "public"."care_types" TO "authenticated";
GRANT ALL ON TABLE "public"."care_types" TO "service_role";



GRANT ALL ON SEQUENCE "public"."care_types_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."care_types_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,MAINTAIN,UPDATE ON TABLE "public"."consultations" TO "authenticated";
GRANT ALL ON TABLE "public"."consultations" TO "service_role";



GRANT ALL ON TABLE "public"."kennels" TO "authenticated";
GRANT ALL ON TABLE "public"."kennels" TO "service_role";



GRANT ALL ON TABLE "public"."lab_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."lab_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."lab_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."lab_orders" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,MAINTAIN,UPDATE ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";



GRANT ALL ON TABLE "public"."prescription_items" TO "authenticated";
GRANT ALL ON TABLE "public"."prescription_items" TO "service_role";



GRANT ALL ON TABLE "public"."prescriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."prescriptions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,MAINTAIN,UPDATE ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT INSERT("sku"),UPDATE("sku") ON TABLE "public"."products" TO "authenticated";



GRANT INSERT("name"),UPDATE("name") ON TABLE "public"."products" TO "authenticated";



GRANT INSERT("category"),UPDATE("category") ON TABLE "public"."products" TO "authenticated";



GRANT INSERT("price"),UPDATE("price") ON TABLE "public"."products" TO "authenticated";



GRANT INSERT("min_stock"),UPDATE("min_stock") ON TABLE "public"."products" TO "authenticated";



GRANT INSERT("is_active"),UPDATE("is_active") ON TABLE "public"."products" TO "authenticated";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,MAINTAIN,UPDATE ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT UPDATE("full_name") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("job_title") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("avatar_url") ON TABLE "public"."profiles" TO "authenticated";



GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."surgeries" TO "authenticated";
GRANT ALL ON TABLE "public"."surgeries" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,MAINTAIN,UPDATE ON TABLE "public"."vaccinations" TO "authenticated";
GRANT ALL ON TABLE "public"."vaccinations" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,MAINTAIN,UPDATE ON TABLE "public"."vaccines" TO "authenticated";
GRANT ALL ON TABLE "public"."vaccines" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."clinical_history" TO "authenticated";
GRANT ALL ON TABLE "public"."clinical_history" TO "service_role";



GRANT ALL ON TABLE "public"."kennel_occupancy" TO "authenticated";
GRANT ALL ON TABLE "public"."kennel_occupancy" TO "service_role";



GRANT ALL ON SEQUENCE "public"."kennels_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."kennels_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,MAINTAIN,UPDATE ON TABLE "public"."owners" TO "authenticated";
GRANT ALL ON TABLE "public"."owners" TO "service_role";



GRANT ALL ON TABLE "public"."patient_weights" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_weights" TO "service_role";



GRANT ALL ON SEQUENCE "public"."patient_weights_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."patient_weights_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."product_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."product_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sale_items" TO "authenticated";
GRANT ALL ON TABLE "public"."sale_items" TO "service_role";



GRANT ALL ON TABLE "public"."sales" TO "authenticated";
GRANT ALL ON TABLE "public"."sales" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sales_sale_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sales_sale_number_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."services_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."services_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."species_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."species_catalog" TO "service_role";



GRANT ALL ON SEQUENCE "public"."species_catalog_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."species_catalog_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,MAINTAIN,UPDATE ON TABLE "public"."stock_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_movements" TO "service_role";



GRANT ALL ON SEQUENCE "public"."stock_movements_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."stock_movements_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vaccines_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vaccines_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































