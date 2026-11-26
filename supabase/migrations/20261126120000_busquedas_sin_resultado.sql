-- =====================================================================
-- Búsquedas sin resultado: qué buscó la gente y no encontró
--
-- Se guarda solo el rubro (o la palabra buscada, sin números) y la zona.
-- Nada de la persona: "visitante" es el mismo número al azar del contador
-- de visitas, solo para no contar dos veces lo mismo.
-- El admin lo ve en Estadísticas y recibe un resumen los lunes por Telegram.
-- =====================================================================

create table if not exists public.busquedas_vacias (
  id         bigint generated always as identity primary key,
  creado     timestamptz not null default now(),
  rubro      text check (rubro is null or char_length(rubro) between 2 and 60),
  texto      text check (texto is null or texto ~ '^[a-zñáéíóúü ]{3,40}$'),
  zona       text check (zona is null or char_length(zona) between 2 and 60),
  origen     text not null check (origen in ('buscador', 'chat')),
  visitante  text not null check (char_length(visitante) between 8 and 64),
  check (rubro is not null or texto is not null or zona is not null)
);
create index if not exists busquedas_vacias_creado_idx on public.busquedas_vacias (creado);
create index if not exists busquedas_vacias_visit_idx on public.busquedas_vacias (visitante, creado);

alter table public.busquedas_vacias enable row level security;
revoke all on public.busquedas_vacias from anon, authenticated;

-- ---------------------------------------------------------------------
-- Registrar (lo llama el sitio, también sin sesión)
-- ---------------------------------------------------------------------
create or replace function public.registrar_busqueda_vacia(
  p_rubro text, p_texto text, p_zona text, p_origen text, p_visitante text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then return; end if;
  if p_visitante is null or char_length(p_visitante) not between 8 and 64 then return; end if;
  if p_origen not in ('buscador', 'chat') then return; end if;

  p_rubro := nullif(btrim(p_rubro), '');
  p_zona  := nullif(btrim(p_zona), '');
  -- La palabra buscada: minúsculas, sin números ni signos (así no se cuela un teléfono)
  p_texto := nullif(btrim(regexp_replace(lower(coalesce(p_texto, '')), '[^a-zñáéíóúü ]+', ' ', 'g')), '');
  p_texto := nullif(btrim(regexp_replace(left(p_texto, 40), '\s+', ' ', 'g')), '');
  if p_texto is not null and char_length(p_texto) < 3 then p_texto := null; end if;
  if p_rubro is not null then p_texto := null; end if;   -- con el rubro alcanza

  if p_rubro is not null and (char_length(p_rubro) > 60 or p_rubro !~ '^[[:alpha:] ,./()-]+$') then return; end if;
  if p_zona  is not null and (char_length(p_zona)  > 60 or p_zona  !~ '^[[:alpha:] .-]+$') then return; end if;
  if p_rubro is null and p_texto is null and p_zona is null then return; end if;

  -- La misma búsqueda del mismo dispositivo cuenta una vez por día
  if exists (
    select 1 from public.busquedas_vacias
    where visitante = p_visitante
      and rubro is not distinct from p_rubro
      and texto is not distinct from p_texto
      and zona  is not distinct from p_zona
      and creado > now() - interval '1 day'
  ) then return; end if;

  -- Frenos contra abusos
  if (select count(*) from public.busquedas_vacias
      where visitante = p_visitante and creado > now() - interval '1 hour') >= 20 then return; end if;
  if (select count(*) from public.busquedas_vacias where creado > now() - interval '1 hour') >= 500 then return; end if;

  insert into public.busquedas_vacias (rubro, texto, zona, origen, visitante)
  values (p_rubro, p_texto, p_zona, p_origen, p_visitante);
end;
$$;
revoke execute on function public.registrar_busqueda_vacia(text, text, text, text, text) from public;
grant execute on function public.registrar_busqueda_vacia(text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Ranking para el panel (solo admin)
-- ---------------------------------------------------------------------
create or replace function public.busquedas_sin_resultado(p_dias integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo para administradores';
  end if;
  p_dias := greatest(1, least(coalesce(p_dias, 30), 180));
  return coalesce((
    select jsonb_agg(to_jsonb(t) order by t.personas desc, t.veces desc, t.ultima desc)
    from (
      select coalesce(rubro, texto) as que,
             rubro is null and texto is not null as es_texto,
             zona,
             count(*)::int as veces,
             count(distinct visitante)::int as personas,
             max(creado) as ultima
      from public.busquedas_vacias
      where creado > now() - make_interval(days => p_dias)
      group by 1, 2, 3
      order by count(distinct visitante) desc, count(*) desc
      limit 30
    ) t
  ), '[]'::jsonb);
end;
$$;
revoke execute on function public.busquedas_sin_resultado(integer) from public, anon;
grant execute on function public.busquedas_sin_resultado(integer) to authenticated;

-- ---------------------------------------------------------------------
-- Resumen semanal por Telegram (lunes a la mañana)
-- ---------------------------------------------------------------------
create table if not exists public.resumen_busquedas_envios (
  semana     date primary key,
  request_id bigint,
  enviado    timestamptz not null default now()
);
alter table public.resumen_busquedas_envios enable row level security;
revoke all on public.resumen_busquedas_envios from anon, authenticated;

create or replace function public.enviar_resumen_busquedas()
returns bigint
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_token text; v_chat text; v_id bigint; v_txt text; v_lineas text;
  v_semana date := date_trunc('week', now() at time zone 'America/Argentina/Tucuman')::date;
  v_previo bigint;
begin
  -- Si el de esta semana ya salió bien, no se repite (el cron lo intenta varias veces por si falla)
  select request_id into v_previo from public.resumen_busquedas_envios where semana = v_semana;
  if v_previo is not null and exists (
    select 1 from net._http_response where id = v_previo and status_code between 200 and 299
  ) then
    return null;
  end if;

  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'telegram_bot_token';
  select decrypted_secret into v_chat from vault.decrypted_secrets where name = 'telegram_chat_id';
  if v_token is null or v_chat is null then return null; end if;

  select string_agg(
           '• ' || public.html_escape(coalesce(rubro, '"' || texto || '"', 'Cualquier rubro'))
           || coalesce(' · ' || public.html_escape(zona), '')
           || ': ' || personas || case when personas = 1 then ' persona' else ' personas' end,
           E'\n' order by personas desc, veces desc)
    into v_lineas
  from (
    select rubro, texto, zona, count(*) as veces, count(distinct visitante) as personas
    from public.busquedas_vacias
    where creado > now() - interval '7 days'
    group by rubro, texto, zona
    order by count(distinct visitante) desc, count(*) desc
    limit 15
  ) t;

  v_txt := '🔎 <b>Buscaron y no encontraron</b> (últimos 7 días)' || E'\n\n'
    || coalesce(v_lineas, 'Esta semana todas las búsquedas encontraron algo 👌')
    || E'\n\n👉 <a href="https://tucuoficios.net.ar/estadisticas">Ver el detalle</a>';

  v_id := net.http_post(
    url := 'https://api.telegram.org/bot' || v_token || '/sendMessage',
    body := jsonb_build_object('chat_id', v_chat, 'text', v_txt, 'parse_mode', 'HTML', 'disable_web_page_preview', true),
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 20000);

  insert into public.resumen_busquedas_envios (semana, request_id) values (v_semana, v_id)
  on conflict (semana) do update set request_id = excluded.request_id, enviado = now();

  -- Lo de más de 6 meses ya no sirve
  delete from public.busquedas_vacias where creado < now() - interval '180 days';
  delete from public.resumen_busquedas_envios where semana < v_semana - 60;
  return v_id;
end;
$$;
revoke execute on function public.enviar_resumen_busquedas() from public, anon, authenticated;

-- Lunes desde las 8:07 de Tucumán (11:07 UTC). El primer envío a veces vence por el handshake TLS,
-- así que se intenta cada 10 minutos hasta las 11:57; cuando uno sale bien, los demás no hacen nada.
select cron.unschedule('resumen-busquedas') where exists (select 1 from cron.job where jobname = 'resumen-busquedas');
select cron.schedule('resumen-busquedas', '7-57/10 11-14 * * 1', 'select public.enviar_resumen_busquedas()');
