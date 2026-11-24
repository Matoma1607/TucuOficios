-- Reintento automático de avisos de Telegram (el primer envío a veces vence por el handshake TLS)
create table if not exists public.telegram_envios (
  request_id  bigint primary key,
  job_id      uuid not null,
  tipo        text not null,
  intento     integer not null default 1,
  reintentado boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.telegram_envios enable row level security;
revoke all on public.telegram_envios from anon, authenticated;

drop function if exists public.enviar_aviso_telegram(jobs, text);
CREATE OR REPLACE FUNCTION public.enviar_aviso_telegram(j jobs, p_tipo text, p_intento integer DEFAULT 1)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_token text; v_chat text; v_id bigint; v_txt text; v_wa text; v_link_txt text;
  v_nombre text := split_part(btrim(coalesce(j.professional_name, '')), ' ', 1);
  v_lo_cargo_admin boolean := exists (select 1 from public.admins where user_id = j.owner_id);
begin
  if length(v_nombre) <= 2 then v_nombre := btrim(coalesce(j.professional_name, '')); end if;

  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'telegram_bot_token';
  select decrypted_secret into v_chat from vault.decrypted_secrets where name = 'telegram_chat_id';
  if v_token is null or v_chat is null then return null; end if;

  if p_tipo = 'nueva' then
    v_txt := '🆕 Nueva publicación pendiente en TucuOficios';
    v_wa := '¡Hola ' || v_nombre || '! 👋 Soy Matías, de TucuOficios. Gracias por publicar "' || coalesce(j.title, '') ||
            '". La estamos revisando y en breve va a estar visible en el sitio. Si querés ayuda con las fotos o la descripción, escribinos por acá. Y si querés, seguinos en Instagram: instagram.com/tucuoficios.net.ar ¡Éxitos!';
    v_link_txt := '💬 Darle la bienvenida por WhatsApp';
  elsif p_tipo = 'editada' then
    v_txt := '✏️ Publicación editada, vuelve a revisión';
    v_wa := '¡Hola ' || v_nombre || '! Soy Matías, de TucuOficios. Vimos que editaste tu publicación; la revisamos y en breve vuelve a estar visible.';
    v_link_txt := '💬 Escribirle por WhatsApp';
  else
    v_txt := '✅ Publicación aprobada en TucuOficios';
    v_wa := '¡Listo ' || v_nombre || '! 🙌 Tu publicación ya está en TucuOficios: tucuoficios.net.ar/' || coalesce(j.alias, '') ||
            ' Compartila en tus estados y en Instagram.' ||
            case when v_lo_cargo_admin then ''
                 else ' Desde "Mis publicaciones" podés descargar tu QR y una imagen para historias.' end;
    v_link_txt := '💬 Avisarle por WhatsApp';
  end if;

  v_txt := public.html_escape(v_txt)
    || E'\n\n👤 ' || public.html_escape(j.professional_name)
    || E'\n🛠 ' || public.html_escape(j.title)
    || E'\n📍 ' || public.html_escape(j.zone)
    || case when p_tipo = 'aprobada' and j.alias is not null
            then E'\n🔗 tucuoficios.net.ar/' || public.html_escape(j.alias) else '' end
    || E'\n\n<a href="https://wa.me/' || coalesce(j.whatsapp, '') || '?text=' || public.url_encode(v_wa) || '">'
    || public.html_escape(v_link_txt) || '</a>'
    || case when p_tipo <> 'aprobada' then E'\n👉 <a href="https://tucuoficios.net.ar">Entrá a revisarla</a>' else '' end;

  v_id := net.http_post(
    url := 'https://api.telegram.org/bot' || v_token || '/sendMessage',
    body := jsonb_build_object('chat_id', v_chat, 'text', v_txt, 'parse_mode', 'HTML', 'disable_web_page_preview', true),
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 20000);
  insert into public.telegram_envios(request_id, job_id, tipo, intento) values (v_id, j.id, p_tipo, p_intento);
  return v_id;
end $function$;
revoke execute on function public.enviar_aviso_telegram(jobs, text, integer) from public, anon, authenticated;

-- Cada minuto reenvía los avisos que fallaron (timeout o error del servidor), hasta 3 reintentos.
create or replace function public.reintentar_avisos_telegram()
returns integer language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare r record; j public.jobs; n integer := 0;
begin
  for r in
    select e.* from public.telegram_envios e
    join net._http_response h on h.id = e.request_id
    where not e.reintentado and e.intento < 4
      and e.created_at > now() - interval '2 hours'
      and (h.status_code is null or h.status_code >= 500 or h.status_code = 429)
  loop
    update public.telegram_envios set reintentado = true where request_id = r.request_id;
    select * into j from public.jobs where id = r.job_id;
    if found then
      perform public.enviar_aviso_telegram(j, r.tipo, r.intento + 1);
      n := n + 1;
    end if;
  end loop;
  delete from public.telegram_envios where created_at < now() - interval '3 days';
  return n;
end $$;
revoke execute on function public.reintentar_avisos_telegram() from public, anon, authenticated;

select cron.unschedule('reintentar-avisos-telegram') where exists (select 1 from cron.job where jobname = 'reintentar-avisos-telegram');
select cron.schedule('reintentar-avisos-telegram', '* * * * *', 'select public.reintentar_avisos_telegram()');
