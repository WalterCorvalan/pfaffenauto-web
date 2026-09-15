-- Corrige la RUTA de todos los cron jobs que todavía apuntan a
-- /api/cron/panel-v2/... -- las carpetas de código se renombraron a
-- app/api/cron/panel/ (ya no usamos "v2", quedó "panel" a secas).
--
-- Independiente de migraciones/sql_fix_dominio_crons_vercel.sql (esa
-- corrige el DOMINIO, esta corrige la RUTA) -- da igual el orden en que
-- se corran las dos, y esta es segura de re-correr si hiciera falta.
--
-- Correr una sola vez en el editor SQL de Supabase, DESPUÉS de deployar
-- el rename (si se corre antes de que el deploy esté arriba, el cron va
-- a fallar con 404 hasta que el deploy nuevo esté activo).

do $$
declare
  j record;
begin
  for j in select jobid, jobname, command from cron.job where command like '%panel-v2%' loop
    perform cron.alter_job(
      job_id := j.jobid,
      command := replace(j.command, '/api/cron/panel-v2/', '/api/cron/panel/')
    );
    raise notice 'Actualizado cron job % (id %)', j.jobname, j.jobid;
  end loop;
end $$;

-- Para confirmar qué quedó (correr aparte, es solo consulta):
-- select jobid, jobname, command from cron.job order by jobname;
