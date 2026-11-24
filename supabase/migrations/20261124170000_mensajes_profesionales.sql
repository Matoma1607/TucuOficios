-- Mensajes de WhatsApp (bienvenida, edición y aprobación) con tono más profesional
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
    v_wa := 'Hola ' || v_nombre || ', ¿cómo estás? Te escribimos de TucuOficios. Recibimos tu publicación "' || coalesce(j.title, '') ||
            '" y ya la estamos revisando; en breve va a estar visible en el sitio.' || E'\n\n' ||
            'Si necesitás ayuda con las fotos o la descripción, podés escribirnos por este medio.' || E'\n\n' ||
            'Te invitamos a seguirnos en Instagram: instagram.com/tucuoficios.net.ar' || E'\n\n' ||
            'Saludos, equipo TucuOficios.';
    v_link_txt := '💬 Darle la bienvenida por WhatsApp';
  elsif p_tipo = 'editada' then
    v_txt := '✏️ Publicación editada, vuelve a revisión';
    v_wa := 'Hola ' || v_nombre || ', vimos que actualizaste tu publicación en TucuOficios. La estamos revisando y en breve vuelve a estar visible.' || E'\n\n' ||
            'Saludos, equipo TucuOficios.';
    v_link_txt := '💬 Escribirle por WhatsApp';
  else
    v_txt := '✅ Publicación aprobada en TucuOficios';
    v_wa := 'Hola ' || v_nombre || ', te confirmamos que tu publicación ya está activa en TucuOficios: tucuoficios.net.ar/' || coalesce(j.alias, '') || E'\n\n' ||
            'Te recomendamos compartirla en tus estados y redes para que más personas te encuentren.' ||
            case when v_lo_cargo_admin then ''
                 else ' Desde "Mis publicaciones" podés descargar tu código QR y una imagen para historias.' end || E'\n\n' ||
            'Cualquier consulta, estamos a disposición. Equipo TucuOficios.';
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
