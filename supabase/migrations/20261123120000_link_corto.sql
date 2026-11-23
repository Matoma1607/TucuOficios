-- =====================================================================
-- Link corto para cada publicación: tucuoficios.net.ar/<alias>
--   * Se genera solo con el primer nombre y el oficio (ej: juan-plomero).
--   * El profesional lo puede cambiar; la base valida formato, que no
--     esté reservado y que no lo use otra publicación.
--   * Una vez asignado no cambia solo (si edita el nombre o el título el
--     link sigue igual, para no romper lo que ya compartió).
-- =====================================================================

-- Texto -> formato de link (minúsculas, sin tildes, guiones)
create or replace function public.alias_slug(t text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    translate(lower(coalesce(t, '')), 'áàäâãéèëêíìïîóòöôõúùüûñç', 'aaaaaeeeeiiiiooooouuuunc'),
    '[^a-z0-9]+', '-', 'g'))
$$;

-- Palabras que no pueden ser link (son páginas del sitio o se prestan a confusión)
create or replace function public.alias_reservado(a text)
returns boolean
language sql
immutable
as $$
  select a = any (array[
    'p', 'admin', 'administrador', 'administracion', 'estadisticas', 'privacidad', 'publicar',
    'buscar', 'guardados', 'cuenta', 'login', 'entrar', 'salir', 'ayuda', 'api', 'assets',
    'sitemap', 'robots', 'favicon', 'manifest', 'icon', 'tucuoficios', 'dev', 'www', 'app',
    'perfil', 'perfiles', 'inicio', 'contacto', 'soporte', 'terminos', 'oficios', 'null',
    'undefined', 'eventos', 'supabase', 'netlify', 'google', 'whatsapp', 'instagram',
    'oficial', 'moderador', 'staff'
  ])
$$;

alter table public.jobs add column if not exists alias text;

create unique index if not exists jobs_alias_uk on public.jobs (alias) where alias is not null;

alter table public.jobs drop constraint if exists jobs_alias_formato;
alter table public.jobs add constraint jobs_alias_formato check (
  alias is null or (
    alias ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'
    and alias !~ '--'
    and not public.alias_reservado(alias)
  )
);

-- Primer link libre a partir de una base (base, base-2, base-3...)
create or replace function public.alias_libre(p_base text, p_excluir uuid default null)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_base text := trim(both '-' from left(public.alias_slug(p_base), 36));
  v_cand text;
  i int := 1;
begin
  if length(v_base) < 3 then
    v_base := rtrim(v_base || '-tuc', '-');
  end if;
  v_cand := v_base;
  while public.alias_reservado(v_cand)
     or exists (select 1 from public.jobs where alias = v_cand and id is distinct from p_excluir) loop
    i := i + 1;
    v_cand := v_base || '-' || i;
  end loop;
  return v_cand;
end;
$$;

-- Sugerencia: primer nombre + primera palabra que describa el oficio
create or replace function public.alias_sugerido(p_nombre text, p_titulo text, p_categoria text default null, p_excluir uuid default null)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_nombre text := split_part(public.alias_slug(p_nombre), '-', 1);
  v_palabra text := '';
  w text;
  v_vacias text[] := array['de','del','y','e','a','al','en','la','el','los','las','por','para','con',
    'sin','un','una','mi','tu','su','servicio','servicios','venta','ventas','trabajos','trabajo',
    'general','generales','todo','tipo','mejor','precio','calidad','hogar','casa','aprende','aprenda',
    'otros','otro'];
begin
  -- Primero el título; si no dice nada útil, la categoría
  foreach w in array coalesce(string_to_array(public.alias_slug(p_titulo), '-'), '{}'::text[])
                  || coalesce(string_to_array(public.alias_slug(p_categoria), '-'), '{}'::text[]) loop
    if length(w) > 2 and not (w = any (v_vacias)) and w <> v_nombre then
      v_palabra := w;
      exit;
    end if;
  end loop;
  if v_nombre = '' then v_nombre := 'oficio'; end if;
  return public.alias_libre(case when v_palabra = '' then v_nombre else v_nombre || '-' || v_palabra end, p_excluir);
end;
$$;

-- Asigna / valida el link al guardar
create or replace function public.jobs_alias()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.alias is not distinct from old.alias then
    return new;
  end if;

  if new.alias is null or btrim(new.alias) = '' then
    -- Nunca se borra un link ya asignado
    if tg_op = 'UPDATE' and old.alias is not null then
      new.alias := old.alias;
    else
      new.alias := public.alias_sugerido(new.professional_name, new.title, new.category, new.id);
    end if;
    return new;
  end if;

  new.alias := trim(both '-' from left(public.alias_slug(new.alias), 40));
  if length(new.alias) < 3 then
    raise exception 'El link tiene que tener al menos 3 letras o números.';
  end if;
  if public.alias_reservado(new.alias) then
    raise exception 'Ese link está reservado. Probá con otro.';
  end if;
  if exists (select 1 from public.jobs where alias = new.alias and id <> new.id) then
    raise exception 'Ese link ya lo usa otra publicación. Probá con otro.';
  end if;
  return new;
end;
$$;

drop trigger if exists jobs_alias on public.jobs;
create trigger jobs_alias
  before insert or update of alias on public.jobs
  for each row execute function public.jobs_alias();

-- Para el formulario: ¿está libre este link? (y una alternativa si no)
create or replace function public.alias_disponible(p_alias text, p_job uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v text := trim(both '-' from left(public.alias_slug(p_alias), 40));
  v_estado text;
begin
  if length(v) < 3 then
    v_estado := 'corto';
  elsif public.alias_reservado(v) then
    v_estado := 'reservado';
  elsif exists (select 1 from public.jobs where alias = v and id is distinct from p_job) then
    v_estado := 'usado';
  else
    v_estado := 'libre';
  end if;
  return jsonb_build_object(
    'alias', v,
    'estado', v_estado,
    'alternativa', case when v_estado in ('usado', 'reservado') then public.alias_libre(v, p_job) end
  );
end;
$$;

revoke execute on function public.alias_libre(text, uuid) from public, anon, authenticated;
revoke execute on function public.jobs_alias() from public, anon, authenticated;
revoke execute on function public.alias_sugerido(text, text, text, uuid) from public;
grant execute on function public.alias_sugerido(text, text, text, uuid) to anon, authenticated;
revoke execute on function public.alias_disponible(text, uuid) from public;
grant execute on function public.alias_disponible(text, uuid) to anon, authenticated;

-- Links para las publicaciones que ya existen (de la más vieja a la más nueva).
-- Se corre como admin para que el control de "vuelve a revisión" no las pase a pendiente.
select set_config('request.jwt.claims',
  '{"sub":"1769f37e-17ca-4c2f-8f45-903d22a4473b","role":"authenticated"}', false);
do $$
declare r record;
begin
  for r in select id, professional_name, title, category from public.jobs where alias is null order by created_at loop
    update public.jobs
      set alias = public.alias_sugerido(r.professional_name, r.title, r.category, r.id)
      where id = r.id;
  end loop;
end;
$$;
select set_config('request.jwt.claims', '', false);
