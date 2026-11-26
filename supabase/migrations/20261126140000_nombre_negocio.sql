-- Nombre del emprendimiento o negocio (opcional). Si está, el sitio lo muestra como nombre
-- principal y la persona queda como "a cargo de". El link corto sale de acá cuando existe.
alter table public.jobs add column if not exists negocio text;
alter table public.jobs drop constraint if exists jobs_negocio_check;
alter table public.jobs add constraint jobs_negocio_check
  check (negocio is null or char_length(btrim(negocio)) between 2 and 60);
