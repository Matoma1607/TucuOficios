-- =====================================================================
-- Aviso de Telegram con link para escribirle al profesional por WhatsApp
--   * Publicación nueva (pendiente): link "Darle la bienvenida".
--   * Publicación aprobada: link "Avisarle que ya está publicada" con su link corto.
-- El mensaje se abre ya escrito en WhatsApp; solo hay que apretar enviar.
-- =====================================================================

-- Codifica texto para usarlo dentro de una URL (UTF-8, %XX)
create or replace function public.url_encode(t text)
returns text
language plpgsql
immutable
as $$
declare
  b bytea := convert_to(coalesce(t, ''), 'UTF8');
  r text := '';
  c int;
begin
  for i in 0 .. length(b) - 1 loop
    c := get_byte(b, i);
    if (c between 48 and 57) or (c between 65 and 90) or (c between 97 and 122) or c in (45, 46, 95, 126) then
      r := r || chr(c);
    else
      r := r || '%' || upper(lpad(to_hex(c), 2, '0'));
    end if;
  end loop;
  return r;
end;
$$;

-- Escapa texto para el modo HTML de Telegram
create or replace function public.html_escape(t text)
returns text
language sql
immutable
as $$
  select replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
$$;

create or replace function public.notify_telegram_pendiente()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_token text; v_chat text; v_txt text; v_wa text; v_link_txt text;
  v_nombre text := split_part(btrim(coalesce(new.professional_name, '')), ' ', 1);
  v_lo_cargo_admin boolean := exists (select 1 from public.admins where user_id = new.owner_id);
  v_nueva boolean := new.estado = 'pendiente' and (tg_op = 'INSERT' or old.estado is distinct from 'pendiente');
  v_aprobada boolean := new.estado = 'aprobado' and (tg_op = 'INSERT' or old.estado is distinct from 'aprobado');
begin
  if not (v_nueva or v_aprobada) then return new; end if;
  if length(v_nombre) <= 2 then v_nombre := btrim(coalesce(new.professional_name, '')); end if;

  select decrypted_secret into v_token from vault.decrypted_secrets where name = 'telegram_bot_token';
  select decrypted_secret into v_chat from vault.decrypted_secrets where name = 'telegram_chat_id';
  if v_token is null or v_chat is null then return new; end if;

  if v_nueva then
    v_txt := case when tg_op = 'INSERT' then '🆕 Nueva publicación pendiente en TucuOficios' else '✏️ Publicación editada, vuelve a revisión' end;
    v_wa := '¡Hola ' || v_nombre || '! 👋 Soy Matías, de TucuOficios. Gracias por publicar "' || coalesce(new.title, '') ||
            '". La estamos revisando y en breve va a estar visible en el sitio. Si querés ayuda con las fotos o la descripción, escribinos por acá. ¡Éxitos!';
    v_link_txt := case when tg_op = 'INSERT' then '💬 Darle la bienvenida por WhatsApp' else '💬 Escribirle por WhatsApp' end;
    if tg_op <> 'INSERT' then
      v_wa := '¡Hola ' || v_nombre || '! Soy Matías, de TucuOficios. Vimos que editaste tu publicación; la revisamos y en breve vuelve a estar visible.';
    end if;
  else
    v_txt := '✅ Publicación aprobada en TucuOficios';
    v_wa := '¡Listo ' || v_nombre || '! 🙌 Tu publicación ya está en TucuOficios: tucuoficios.net.ar/' || coalesce(new.alias, '') ||
            ' Compartila en tus estados y en Instagram.' ||
            case when v_lo_cargo_admin then ''
                 else ' Desde "Mis publicaciones" podés descargar tu QR y una imagen para historias.' end;
    v_link_txt := '💬 Avisarle por WhatsApp';
  end if;

  v_txt := public.html_escape(v_txt)
    || E'\n\n👤 ' || public.html_escape(new.professional_name)
    || E'\n🛠 ' || public.html_escape(new.title)
    || E'\n📍 ' || public.html_escape(new.zone)
    || case when v_aprobada and new.alias is not null
            then E'\n🔗 tucuoficios.net.ar/' || public.html_escape(new.alias) else '' end
    || E'\n\n<a href="https://wa.me/' || coalesce(new.whatsapp, '') || '?text=' || public.url_encode(v_wa) || '">'
    || public.html_escape(v_link_txt) || '</a>'
    || case when v_nueva then E'\n👉 <a href="https://tucuoficios.net.ar">Entrá a revisarla</a>' else '' end;

  perform net.http_post(
    url := 'https://api.telegram.org/bot' || v_token || '/sendMessage',
    body := jsonb_build_object('chat_id', v_chat, 'text', v_txt, 'parse_mode', 'HTML', 'disable_web_page_preview', true),
    headers := '{"Content-Type":"application/json"}'::jsonb);
  return new;
exception when others then
  return new;
end $function$;

-- Que se dispare con cualquier cambio (las ediciones pasan a "pendiente" dentro de la base,
-- sin que la app mande el campo estado); la función decide si avisa.
drop trigger if exists jobs_notify_telegram on public.jobs;
create trigger jobs_notify_telegram
  after insert or update on public.jobs
  for each row execute function public.notify_telegram_pendiente();

revoke execute on function public.notify_telegram_pendiente() from public, anon, authenticated;
