-- =====================================================================
-- Entregar una publicación que creó el admin a su dueño real.
-- El admin genera un link de un solo uso (vence a los 7 días); la persona lo abre,
-- inicia sesión con Google y la publicación pasa a su cuenta: sigue aprobada,
-- verificada, con su link y sus visitas. En la base solo se guarda el hash del código.
-- =====================================================================

create table if not exists public.entregas (
  job_id      uuid primary key references public.jobs(id) on delete cascade,
  codigo_hash text not null unique,
  creado      timestamptz not null default now(),
  vence       timestamptz not null default now() + interval '7 days'
);
alter table public.entregas enable row level security;
revoke all on public.entregas from anon, authenticated;

-- "entregar" no puede ser el link de nadie
create or replace function public.alias_reservado(a text) returns boolean language sql immutable as $$
  select a = any (array['p','admin','administrador','administracion','estadisticas','privacidad','publicar','buscar','guardados','cuenta','login','entrar','salir','ayuda','api','assets','sitemap','robots','favicon','manifest','icon','tucuoficios','dev','www','app','perfil','perfiles','inicio','contacto','soporte','terminos','oficios','null','undefined','eventos','supabase','netlify','google','whatsapp','instagram','oficial','moderador','staff','entregar','entrega'])
$$;

create or replace function public.entrega_hash(p_codigo text) returns text
language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(upper(regexp_replace(coalesce(p_codigo, ''), '[^A-Za-z0-9]', '', 'g')), 'sha256'), 'hex')
$$;
revoke execute on function public.entrega_hash(text) from public, anon, authenticated;

-- El admin arma el link (uno nuevo anula el anterior). Solo de publicaciones suyas.
create or replace function public.crear_entrega(p_job uuid) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  abc constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  b bytea; c text := ''; i int;
begin
  if not public.is_admin() then raise exception 'Solo para administradores'; end if;
  if not exists (select 1 from public.jobs where id = p_job and owner_id = auth.uid()) then
    raise exception 'Solo podés entregar publicaciones que creaste vos';
  end if;
  b := extensions.gen_random_bytes(8);
  for i in 0..7 loop c := c || substr(abc, 1 + (get_byte(b, i) % 31), 1); end loop;
  insert into public.entregas (job_id, codigo_hash) values (p_job, public.entrega_hash(c))
  on conflict (job_id) do update set codigo_hash = excluded.codigo_hash, creado = now(), vence = now() + interval '7 days';
  return substr(c, 1, 4) || '-' || substr(c, 5, 4);
end $$;
revoke execute on function public.crear_entrega(uuid) from public, anon;
grant execute on function public.crear_entrega(uuid) to authenticated;

create or replace function public.anular_entrega(p_job uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Solo para administradores'; end if;
  delete from public.entregas where job_id = p_job;
end $$;
revoke execute on function public.anular_entrega(uuid) from public, anon;
grant execute on function public.anular_entrega(uuid) to authenticated;

-- Qué publicación es (para mostrarla antes de aceptar). Solo datos que ya son públicos.
create or replace function public.ver_entrega(p_codigo text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r record;
begin
  select j.id, j.title, j.professional_name, j.negocio, j.category, j.zone, j.alias, j.image_path, e.vence
    into r
  from public.entregas e join public.jobs j on j.id = e.job_id
  where e.codigo_hash = public.entrega_hash(p_codigo) and e.vence > now();
  if not found then return jsonb_build_object('valida', false); end if;
  return jsonb_build_object('valida', true, 'id', r.id, 'title', r.title, 'nombre', r.professional_name, 'negocio', r.negocio,
    'category', r.category, 'zone', r.zone, 'alias', r.alias, 'image_path', r.image_path, 'vence', r.vence);
end $$;
revoke execute on function public.ver_entrega(text) from public;
grant execute on function public.ver_entrega(text) to anon, authenticated;

-- El trigger de edición no deja cambiar de dueño ni conserva la aprobación si no es el admin:
-- solo durante una entrega válida (marcada por reclamar_entrega) se le permite.
create or replace function public.jobs_before_update() returns trigger
language plpgsql security definer set search_path to 'public' as $function$
begin
  if current_setting('tucu.entrega', true) = new.id::text then
    new.created_at := old.created_at; new.updated_at := now();
    new.estado := old.estado; new.verificado := old.verificado;
    return new;
  end if;
  new.owner_id := old.owner_id;
  new.created_at := old.created_at;
  new.updated_at := now();
  if not public.is_admin() then
    new.estado := 'pendiente';
    new.verificado := old.verificado;  -- el dueño no puede verificarse solo
  end if;
  return new;
end;
$function$;

-- La persona se queda con la publicación
create or replace function public.reclamar_entrega(p_codigo text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_job uuid; v_title text; v_nombre text; v_token text; v_chat text;
begin
  if auth.uid() is null then raise exception 'Iniciá sesión para quedarte con tu publicación'; end if;
  select e.job_id into v_job from public.entregas e
  where e.codigo_hash = public.entrega_hash(p_codigo) and e.vence > now()
  for update;
  if v_job is null then raise exception 'Este link ya se usó o venció. Pedí uno nuevo.'; end if;
  if exists (select 1 from public.jobs where id = v_job and owner_id = auth.uid()) then
    raise exception 'Esta publicación ya es tuya';
  end if;
  if (select count(*) from public.jobs where owner_id = auth.uid()) >= 5 then
    raise exception 'Llegaste al límite de 5 publicaciones.';
  end if;

  perform set_config('tucu.entrega', v_job::text, true);
  update public.jobs set owner_id = auth.uid() where id = v_job returning title, professional_name into v_title, v_nombre;
  perform set_config('tucu.entrega', '', true);
  delete from public.entregas where job_id = v_job;

  -- aviso al admin (si Telegram falla, la entrega igual queda hecha)
  begin
    select decrypted_secret into v_token from vault.decrypted_secrets where name = 'telegram_bot_token';
    select decrypted_secret into v_chat from vault.decrypted_secrets where name = 'telegram_chat_id';
    if v_token is not null and v_chat is not null then
      perform net.http_post(
        url := 'https://api.telegram.org/bot' || v_token || '/sendMessage',
        body := jsonb_build_object('chat_id', v_chat, 'parse_mode', 'HTML',
          'text', '🤝 <b>' || public.html_escape(v_nombre) || '</b> se quedó con su publicación «' || public.html_escape(v_title) || '».'),
        headers := '{"Content-Type":"application/json"}'::jsonb, timeout_milliseconds := 20000);
    end if;
  exception when others then null;
  end;
  return jsonb_build_object('ok', true, 'id', v_job);
end $$;
revoke execute on function public.reclamar_entrega(text) from public, anon;
grant execute on function public.reclamar_entrega(text) to authenticated;
