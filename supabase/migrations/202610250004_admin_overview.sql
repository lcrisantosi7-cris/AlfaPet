-- AlfaPet · resumen operativo del administrador (una sola llamada, respeta RLS).
drop function if exists public.get_admin_overview();
create function public.get_admin_overview()
returns jsonb
language plpgsql stable security invoker set search_path = ''
as $$
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

revoke all on function public.get_admin_overview() from public, anon;
grant execute on function public.get_admin_overview() to authenticated;