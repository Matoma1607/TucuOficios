-- =====================================================================
-- Endurecimiento de seguridad (revisión del 25/11/2026)
-- =====================================================================

-- 1) Permisos que la app no usa (vaciar tablas, triggers, referencias).
--    Hoy no se pueden usar desde la API, pero mejor no tenerlos.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- 2) Tope de fotos por cuenta: 30 (con 5 publicaciones de 4 fotos sobra).
--    El administrador no tiene tope porque carga publicaciones de otros.
drop policy if exists job_images_insert on storage.objects;
create policy job_images_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'job-images'
    and (storage.foldername(name))[1] = (auth.uid())::text
    and (
      public.is_admin()
      or (select count(*) from storage.objects o
          where o.bucket_id = 'job-images'
            and (storage.foldername(o.name))[1] = (auth.uid())::text) < 30
    )
  );

-- 3) Tope general de eventos por hora (para que nadie infle las estadísticas
--    ni llene la base inventando visitantes). El tráfico real hoy es < 50/hora.
create or replace function public.registrar_evento(p_tipo text, p_job uuid default null::uuid, p_visitante text default null::text, p_dispositivo text default 'otro'::text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_ventana interval;
begin
  if public.is_admin() then return; end if;
  if p_tipo not in ('visita', 'perfil', 'whatsapp') or p_visitante is null or char_length(p_visitante) not between 8 and 64 then return; end if;
  if p_dispositivo not in ('celu', 'compu', 'otro') then p_dispositivo := 'otro'; end if;
  if p_tipo <> 'visita' then
    if p_job is null or not exists (select 1 from public.jobs where id = p_job and estado = 'aprobado') then return; end if;
  else
    p_job := null;
  end if;
  v_ventana := case p_tipo when 'visita' then interval '30 minutes' when 'perfil' then interval '30 minutes' else interval '2 minutes' end;
  if exists (select 1 from public.eventos where visitante = p_visitante and tipo = p_tipo and job_id is not distinct from p_job and creado > now() - v_ventana) then return; end if;
  if (select count(*) from public.eventos where visitante = p_visitante and creado > now() - interval '1 hour') >= 60 then return; end if;
  if (select count(*) from public.eventos where creado > now() - interval '1 hour') >= 2000 then return; end if;
  insert into public.eventos (tipo, job_id, visitante, dispositivo) values (p_tipo, p_job, p_visitante, p_dispositivo);
end;
$function$;
