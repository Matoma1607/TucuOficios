-- =====================================================================
-- TucuOficios · Esquema Supabase
-- Pegar completo en: Supabase → SQL Editor → New query → Run
--
-- Es el esquema inicial. Los cambios posteriores están en
-- supabase/migrations/ (en orden por fecha): aplicalos después de este.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. ADMINS
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Cada usuario solo puede ver si él mismo es admin. Nadie puede
-- insertar/borrar admins desde la web: solo desde el SQL Editor.
drop policy if exists admins_select_self on public.admins;
create policy admins_select_self on public.admins
  for select using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- 2. PUBLICACIONES (jobs)
-- ---------------------------------------------------------------------
create table if not exists public.jobs (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title             text not null check (char_length(title) between 5 and 80),
  category          text not null check (char_length(category) between 2 and 40),
  zone              text not null check (char_length(zone) between 2 and 60),
  professional_name text not null check (char_length(professional_name) between 2 and 60),
  whatsapp          text not null check (whatsapp ~ '^549[0-9]{10}$'),
  description       text not null check (char_length(description) between 10 and 600),
  image_path        text,
  estado            text not null default 'pendiente'
                    check (estado in ('pendiente', 'aprobado', 'rechazado')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists jobs_estado_created_idx on public.jobs (estado, created_at desc);
create index if not exists jobs_owner_idx on public.jobs (owner_id);

alter table public.jobs enable row level security;

-- Lectura: el público ve solo aprobadas; el dueño ve las suyas; admin ve todo.
drop policy if exists jobs_select on public.jobs;
create policy jobs_select on public.jobs
  for select using (
    estado = 'aprobado' or owner_id = auth.uid() or public.is_admin()
  );

-- Alta: solo usuarios logueados y siempre a su nombre.
drop policy if exists jobs_insert on public.jobs;
create policy jobs_insert on public.jobs
  for insert to authenticated
  with check (owner_id = auth.uid());

-- Edición: dueño o admin.
drop policy if exists jobs_update on public.jobs;
create policy jobs_update on public.jobs
  for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- Borrado: dueño o admin.
drop policy if exists jobs_delete on public.jobs;
create policy jobs_delete on public.jobs
  for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- 3. REGLAS DE NEGOCIO (las aplica el servidor, no el navegador)
-- ---------------------------------------------------------------------

-- Al crear: siempre "pendiente", siempre del usuario logueado y máximo
-- 5 publicaciones por persona (los admins no tienen límite).
create or replace function public.jobs_before_insert()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.owner_id := auth.uid();
    new.estado   := 'pendiente';

    if (select count(*) from public.jobs where owner_id = auth.uid()) >= 5 then
      raise exception 'Llegaste al límite de 5 publicaciones.';
    end if;

    if exists (
      select 1 from public.jobs
      where owner_id = auth.uid() and created_at > now() - interval '2 minutes'
    ) then
      raise exception 'Esperá un par de minutos antes de publicar de nuevo.';
    end if;
  end if;

  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists jobs_before_insert on public.jobs;
create trigger jobs_before_insert
  before insert on public.jobs
  for each row execute function public.jobs_before_insert();

-- Al editar: el dueño no puede cambiar el estado ni el dueño; si edita
-- algo, la publicación vuelve a revisión. El admin puede todo.
create or replace function public.jobs_before_update()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  new.owner_id   := old.owner_id;
  new.created_at := old.created_at;
  new.updated_at := now();

  if not public.is_admin() then
    new.estado := 'pendiente';
  end if;

  return new;
end;
$$;

drop trigger if exists jobs_before_update on public.jobs;
create trigger jobs_before_update
  before update on public.jobs
  for each row execute function public.jobs_before_update();

-- ---------------------------------------------------------------------
-- 4. FOTOS (Storage)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('job-images', 'job-images', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Cada usuario solo puede subir dentro de su propia carpeta: <user_id>/archivo
drop policy if exists job_images_insert on storage.objects;
create policy job_images_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'job-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage exige permiso de lectura además del de borrado para poder borrar.
drop policy if exists job_images_select on storage.objects;
create policy job_images_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'job-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- Borrar: dueño de la carpeta o admin.
drop policy if exists job_images_delete on storage.objects;
create policy job_images_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'job-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ---------------------------------------------------------------------
-- 5. HACERTE ADMIN
-- Primero entrá a la web con tu cuenta de Google UNA vez, después
-- reemplazá el email y ejecutá SOLO esta línea:
-- ---------------------------------------------------------------------
-- insert into public.admins (user_id)
--   select id from auth.users where email = 'TU_EMAIL@gmail.com';

-- ---------------------------------------------------------------------
-- 6. GALERÍA (agregado después): hasta 3 fotos extra además de la portada
-- ---------------------------------------------------------------------
alter table public.jobs
  add column if not exists gallery text[] not null default '{}';

alter table public.jobs drop constraint if exists jobs_gallery_max;
alter table public.jobs
  add constraint jobs_gallery_max check (cardinality(gallery) <= 3);
