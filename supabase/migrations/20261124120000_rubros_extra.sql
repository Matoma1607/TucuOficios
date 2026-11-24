-- =====================================================================
-- Varios rubros en una misma publicación: un rubro principal (category)
-- y hasta 3 más (categorias_extra). Así quien hace varias cosas publica
-- una sola vez y lo encuentran en todos sus rubros.
-- =====================================================================

create or replace function public.categorias_validas(cats text[], principal text)
returns boolean
language sql
immutable
as $$
  select cardinality(cats) <= 3
     and not (principal = any (cats))
     and coalesce((select bool_and(char_length(c) between 2 and 40) from unnest(cats) c), true)
     and cardinality(cats) = (select count(distinct c) from unnest(cats) c)
$$;

alter table public.jobs add column if not exists categorias_extra text[] not null default '{}';

alter table public.jobs drop constraint if exists jobs_categorias_extra_check;
alter table public.jobs add constraint jobs_categorias_extra_check
  check (public.categorias_validas(categorias_extra, category));
