-- =====================================================================
-- Aviso de Telegram más robusto
--   * La conexión a Telegram a veces tarda: se espera hasta 20 s (antes 5 s).
--   * El armado y envío del aviso queda en una función aparte
--     (enviar_aviso_telegram) que también se puede llamar a mano para reenviar.
-- =====================================================================

create or replace function public.enviar_aviso_telegram(j public.jobs, p_tipo text)
returns bigint
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_token text; v_chat text; v_txt text; v_wa text; v_link_txt text;
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
            '". La estamos revisando y en breve va a estar visible en el sitio. Si querés ayuda con las fotos o la descripción, escribinos por acá. ¡Éxitos!';
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

  return net.http_post(
    url := 'https://api.telegram.org/bot' || v_token || '/sendMessage',
    body := jsonb_build_object('chat_id', v_chat, 'text', v_txt, 'parse_mode', 'HTML', 'disable_web_page_preview', true),
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 20000);
end $function$;

create or replace function public.notify_telegram_pendiente()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
begin
  if new.estado = 'pendiente' and (tg_op = 'INSERT' or old.estado is distinct from 'pendiente') then
    perform public.enviar_aviso_telegram(new, case when tg_op = 'INSERT' then 'nueva' else 'editada' end);
  elsif new.estado = 'aprobado' and (tg_op = 'INSERT' or old.estado is distinct from 'aprobado') then
    perform public.enviar_aviso_telegram(new, 'aprobada');
  end if;
  return new;
exception when others then
  return new;
end $function$;

revoke execute on function public.enviar_aviso_telegram(public.jobs, text) from public, anon, authenticated;
revoke execute on function public.notify_telegram_pendiente() from public, anon, authenticated;
