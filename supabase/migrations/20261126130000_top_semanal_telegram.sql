-- =====================================================================
-- Las más vistas de la semana: los lunes llega a Telegram el top 5 de
-- publicaciones (con al menos 10 visitas) y, para cada una, un link que
-- abre su WhatsApp con un mensaje listo para avisarle cómo le fue.
-- El mensaje no se manda solo: lo envía el admin desde su WhatsApp.
-- =====================================================================

create table if not exists public.top_semana_envios (
  semana     date primary key,
  request_id bigint,           -- -1: no hubo ninguna con suficientes visitas
  enviado    timestamptz not null default now()
);
alter table public.top_semana_envios enable row level security;
revoke all on public.top_semana_envios from anon, authenticated;

create or replace function public.enviar_top_semana()
returns bigint
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_token text; v_chat text; v_id bigint; v_txt text := ''; r record; n integer := 0;
  v_nombre text; v_wa text;
  v_semana date := date_trunc('week', now() at time zone 'America/Argentina/Tucuman')::date;
  v_previo bigint;
begin
  -- Si el de esta semana ya salió bien (o no había nada que mandar), no se repite
  select request_id into v_previo from public.top_semana_envios where semana = v_semana;
  if v_previo = -1 or (v_previo is not null and exists (
    select 1 from net._http_response where id = v_previo and status_code between 200 and 299
  )) then
    return null;
  end if;

  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'telegram_bot_token';
  select decrypted_secret into v_chat from vault.decrypted_secrets where name = 'telegram_chat_id';
  if v_token is null or v_chat is null then return null; end if;

  for r in
    select j.id, j.professional_name, j.category, j.alias, j.whatsapp,
           count(*) filter (where e.tipo = 'perfil')   as vistas,
           count(*) filter (where e.tipo = 'whatsapp') as contactos
    from public.eventos e
    join public.jobs j on j.id = e.job_id and j.estado = 'aprobado'
    where e.creado > now() - interval '7 days'
    group by j.id, j.professional_name, j.category, j.alias, j.whatsapp
    having count(*) filter (where e.tipo = 'perfil') >= 10
    order by count(*) filter (where e.tipo = 'perfil') desc,
             count(*) filter (where e.tipo = 'whatsapp') desc
    limit 5
  loop
    n := n + 1;
    v_nombre := split_part(btrim(coalesce(r.professional_name, '')), ' ', 1);
    if length(v_nombre) <= 2 then v_nombre := btrim(coalesce(r.professional_name, '')); end if;

    v_wa := '¡Hola ' || v_nombre || '! 👋 Desde TucuOficios te queremos contar que esta semana tu publicación tuvo '
         || r.vistas || ' visitas'
         || case when r.contactos = 1 then ' y 1 persona tocó para escribirte por WhatsApp'
                 when r.contactos > 1 then ' y ' || r.contactos || ' personas tocaron para escribirte por WhatsApp'
                 else '' end
         || '. 🙌' || E'\n\n'
         || 'Si compartís tu link en tus estados, te encuentran todavía más: tucuoficios.net.ar/' || coalesce(r.alias, '')
         || E'\n\n' || '¡Éxitos con los trabajos!';

    v_txt := v_txt || E'\n\n' || '<b>' || n || '. ' || public.html_escape(r.professional_name) || '</b> · '
          || public.html_escape(r.category) || E'\n'
          || r.vistas || ' vistas'
          || case when r.contactos > 0 then ', ' || r.contactos || ' tocaron WhatsApp' else '' end
          || E'\n' || '<a href="https://wa.me/' || coalesce(r.whatsapp, '') || '?text=' || public.url_encode(v_wa) || '">💬 Avisarle por WhatsApp</a>';
  end loop;

  if n = 0 then
    insert into public.top_semana_envios (semana, request_id) values (v_semana, -1)
    on conflict (semana) do update set request_id = -1, enviado = now();
    return null;
  end if;

  v_txt := '🏆 <b>Las más vistas de la semana</b>' || v_txt;

  v_id := net.http_post(
    url := 'https://api.telegram.org/bot' || v_token || '/sendMessage',
    body := jsonb_build_object('chat_id', v_chat, 'text', v_txt, 'parse_mode', 'HTML', 'disable_web_page_preview', true),
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 20000);

  insert into public.top_semana_envios (semana, request_id) values (v_semana, v_id)
  on conflict (semana) do update set request_id = excluded.request_id, enviado = now();
  delete from public.top_semana_envios where semana < v_semana - 60;
  return v_id;
end;
$$;
revoke execute on function public.enviar_top_semana() from public, anon, authenticated;

-- Lunes desde las 8:09 de Tucumán (11:09 UTC), justo después del resumen de búsquedas.
-- Se intenta cada 10 minutos hasta las 11:59 por si el primer envío vence; los siguientes no hacen nada.
select cron.unschedule('top-semana') where exists (select 1 from cron.job where jobname = 'top-semana');
select cron.schedule('top-semana', '9-59/10 11-14 * * 1', 'select public.enviar_top_semana()');
