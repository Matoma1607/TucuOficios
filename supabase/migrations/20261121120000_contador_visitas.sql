-- =====================================================================
-- Contador de visitas propio (sin cookies ni servicios externos)
--
-- Guarda tres tipos de evento:
--   visita    -> alguien entró al sitio (una vez cada 30 min por dispositivo)
--   perfil    -> alguien abrió una publicación
--   whatsapp  -> alguien tocó el botón de WhatsApp de una publicación
--
-- "visitante" es un número al azar que genera el navegador y guarda en el
-- mismo dispositivo: no identifica a la persona, solo sirve para no contar
-- dos veces la misma visita.
--
-- Nadie puede leer la tabla directamente: los eventos se cargan con
-- registrar_evento() y solo un admin puede ver los totales con
-- estadisticas().
-- =====================================================================

create table if not exists public.eventos (
  id          bigint generated always as identity primary key,
  creado      timestamptz not null default now(),
  tipo        text not null check (tipo in ('visita', 'perfil', 'whatsapp')),
  job_id      uuid,
  visitante   text not null check (char_length(visitante) between 8 and 64),
  dispositivo text not null default 'otro' check (dispositivo in ('celu', 'compu', 'otro'))
);

create index if not exists eventos_creado_idx on public.eventos (creado);
create index if not exists eventos_job_idx on public.eventos (job_id) where job_id is not null;
create index if not exists eventos_dedupe_idx on public.eventos (visitante, tipo, creado);

alter table public.eventos enable row level security;
-- Sin políticas: nadie lee ni escribe la tabla directamente.
revoke all on public.eventos from anon, authenticated;

-- Totales por día de lo que ya tiene más de 90 días (para que la tabla no crezca)
create table if not exists public.eventos_diarios (
  dia         date not null,
  tipo        text not null,
  job_id      uuid,
  cantidad    integer not null,
  visitantes  integer not null
);
create unique index if not exists eventos_diarios_uk
  on public.eventos_diarios (dia, tipo, coalesce(job_id, '00000000-0000-0000-0000-000000000000'::uuid));
alter table public.eventos_diarios enable row level security;
revoke all on public.eventos_diarios from anon, authenticated;

-- ---------------------------------------------------------------------
-- Registrar un evento (lo llama el sitio, también sin sesión)
-- ---------------------------------------------------------------------
create or replace function public.registrar_evento(
  p_tipo text,
  p_job uuid default null,
  p_visitante text default null,
  p_dispositivo text default 'otro'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ventana interval;
begin
  -- Los admins no se cuentan
  if public.is_admin() then
    return;
  end if;

  if p_tipo not in ('visita', 'perfil', 'whatsapp')
     or p_visitante is null
     or char_length(p_visitante) not between 8 and 64 then
    return;
  end if;

  if p_dispositivo not in ('celu', 'compu', 'otro') then
    p_dispositivo := 'otro';
  end if;

  -- Perfil y WhatsApp tienen que ser de una publicación aprobada
  if p_tipo <> 'visita' then
    if p_job is null or not exists (
      select 1 from public.jobs where id = p_job and estado = 'aprobado'
    ) then
      return;
    end if;
  else
    p_job := null;
  end if;

  -- No contar dos veces lo mismo del mismo dispositivo en poco tiempo
  v_ventana := case p_tipo when 'visita' then interval '30 minutes'
                           when 'perfil' then interval '30 minutes'
                           else interval '2 minutes' end;
  if exists (
    select 1 from public.eventos
    where visitante = p_visitante
      and tipo = p_tipo
      and job_id is not distinct from p_job
      and creado > now() - v_ventana
  ) then
    return;
  end if;

  -- Freno contra abusos: como mucho 60 eventos por hora por dispositivo
  if (select count(*) from public.eventos
      where visitante = p_visitante and creado > now() - interval '1 hour') >= 60 then
    return;
  end if;

  insert into public.eventos (tipo, job_id, visitante, dispositivo)
  values (p_tipo, p_job, p_visitante, p_dispositivo);
end;
$$;

revoke execute on function public.registrar_evento(text, uuid, text, text) from public;
grant execute on function public.registrar_evento(text, uuid, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Estadísticas para el panel (solo admin)
-- ---------------------------------------------------------------------
create or replace function public.estadisticas(p_dias integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_desde timestamptz;
  v_res jsonb;
begin
  if not public.is_admin() then
    raise exception 'Solo para administradores';
  end if;

  p_dias := greatest(1, least(coalesce(p_dias, 30), 90));
  v_desde := date_trunc('day', now() at time zone 'America/Argentina/Tucuman')
             at time zone 'America/Argentina/Tucuman' - make_interval(days => p_dias - 1);

  with ev as (
    select *, (creado at time zone 'America/Argentina/Tucuman')::date as dia
    from public.eventos
    where creado >= v_desde
  ),
  dias as (
    select generate_series(
      (v_desde at time zone 'America/Argentina/Tucuman')::date,
      (now() at time zone 'America/Argentina/Tucuman')::date,
      interval '1 day'
    )::date as dia
  ),
  por_dia as (
    select d.dia,
      count(distinct e.visitante) filter (where e.tipo = 'visita') as personas,
      count(*) filter (where e.tipo = 'perfil')   as perfiles,
      count(*) filter (where e.tipo = 'whatsapp') as whatsapp
    from dias d
    left join ev e on e.dia = d.dia
    group by d.dia
    order by d.dia
  ),
  top as (
    select j.id, j.professional_name as nombre, j.title as titulo,
      count(*) filter (where e.tipo = 'perfil')   as vistas,
      count(*) filter (where e.tipo = 'whatsapp') as whatsapp
    from ev e
    join public.jobs j on j.id = e.job_id
    group by j.id, j.professional_name, j.title
    order by count(*) filter (where e.tipo = 'whatsapp') desc,
             count(*) filter (where e.tipo = 'perfil') desc
    limit 15
  )
  select jsonb_build_object(
    'dias', p_dias,
    'personas', (select count(distinct visitante) from ev where tipo = 'visita'),
    'visitas',  (select count(*) from ev where tipo = 'visita'),
    'perfiles', (select count(*) from ev where tipo = 'perfil'),
    'whatsapp', (select count(*) from ev where tipo = 'whatsapp'),
    'celu',     (select count(*) from ev where tipo = 'visita' and dispositivo = 'celu'),
    'compu',    (select count(*) from ev where tipo = 'visita' and dispositivo = 'compu'),
    'por_dia',  (select coalesce(jsonb_agg(jsonb_build_object(
                   'dia', dia, 'personas', personas, 'perfiles', perfiles, 'whatsapp', whatsapp)
                   order by dia), '[]'::jsonb) from por_dia),
    'top',      (select coalesce(jsonb_agg(to_jsonb(top)), '[]'::jsonb) from top),
    'historico', jsonb_build_object(
      'visitas',  (select count(*) from public.eventos where tipo = 'visita')
                  + coalesce((select sum(cantidad) from public.eventos_diarios where tipo = 'visita'), 0),
      'whatsapp', (select count(*) from public.eventos where tipo = 'whatsapp')
                  + coalesce((select sum(cantidad) from public.eventos_diarios where tipo = 'whatsapp'), 0),
      'desde',    least(
                    (select min(creado) from public.eventos),
                    (select min(dia)::timestamptz from public.eventos_diarios))
    )
  ) into v_res;

  return v_res;
end;
$$;

revoke execute on function public.estadisticas(integer) from public, anon;
grant execute on function public.estadisticas(integer) to authenticated;

-- ---------------------------------------------------------------------
-- Resumen automático: lo de más de 90 días pasa a totales por día
-- ---------------------------------------------------------------------
create or replace function public.resumir_eventos_viejos()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_corte timestamptz := now() - interval '90 days';
begin
  insert into public.eventos_diarios (dia, tipo, job_id, cantidad, visitantes)
  select (creado at time zone 'America/Argentina/Tucuman')::date, tipo, job_id,
         count(*), count(distinct visitante)
  from public.eventos
  where creado < v_corte
  group by 1, 2, 3
  on conflict (dia, tipo, coalesce(job_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do update set cantidad   = eventos_diarios.cantidad + excluded.cantidad,
                visitantes = eventos_diarios.visitantes + excluded.visitantes;

  delete from public.eventos where creado < v_corte;
end;
$$;

revoke execute on function public.resumir_eventos_viejos() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('resumir-eventos-viejos', '17 7 * * *', 'select public.resumir_eventos_viejos()');
