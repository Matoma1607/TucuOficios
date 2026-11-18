-- Instagram opcional del profesional (solo el nombre de usuario, sin @ ni URL).

alter table public.jobs
  add column if not exists instagram text;

alter table public.jobs drop constraint if exists jobs_instagram_formato;
alter table public.jobs
  add constraint jobs_instagram_formato
  check (instagram is null or instagram ~ '^[a-z0-9._]{1,30}$');
