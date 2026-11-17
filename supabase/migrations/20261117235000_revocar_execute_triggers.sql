-- Las funciones de trigger no necesitan ser llamables desde la API (PostgREST /rpc).
-- Los triggers siguen funcionando: Postgres no exige EXECUTE para dispararlos.
-- is_admin() queda accesible a propósito: la usan las políticas RLS y la web.

revoke execute on function public.jobs_before_insert() from public, anon, authenticated;
revoke execute on function public.jobs_before_update() from public, anon, authenticated;
