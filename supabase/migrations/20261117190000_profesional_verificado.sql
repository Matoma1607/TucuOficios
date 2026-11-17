-- Insignia "Verificado": solo un admin puede marcarla o quitarla.

alter table public.jobs
  add column if not exists verificado boolean not null default false;

create or replace function public.jobs_before_insert()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.owner_id   := auth.uid();
    new.estado     := 'pendiente';
    new.verificado := false;

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
    new.estado     := 'pendiente';
    new.verificado := old.verificado;  -- el dueño no puede verificarse solo
  end if;

  return new;
end;
$$;
