-- Corrige TODOS los cron jobs existentes que apuntan a
-- https://www.pfaffencars.com (dominio "definitivo" pero que hoy NO
-- resuelve a este deploy) para que apunten al dominio que sí funciona
-- ahora mismo: https://pfaffenauto-web.vercel.app.
--
-- No hace falta listar cada job a mano: recorre cron.job buscando
-- cualquier comando que mencione pfaffencars.com (cubre también los crons
-- de "pautas" y "automatizaciones" cuyo archivo de migración ya se borró
-- del repo por estar corridos, pero el job en pg_cron sigue vivo con la
-- URL vieja).
--
-- Correr una sola vez en el editor SQL de Supabase. Si en algún momento
-- pfaffencars.com pasa a apuntar de verdad a este deploy, hay que volver
-- a correr esto mismo pero al revés (cambiar los argumentos del replace).

do $$
declare
  j record;
begin
  for j in select jobid, jobname, command from cron.job where command like '%pfaffencars.com%' loop
    perform cron.alter_job(
      job_id := j.jobid,
      command := replace(j.command, 'https://www.pfaffencars.com', 'https://pfaffenauto-web.vercel.app')
    );
    raise notice 'Actualizado cron job % (id %)', j.jobname, j.jobid;
  end loop;
end $$;

-- Para confirmar qué quedó (correr aparte, es solo consulta):
-- select jobid, jobname, command from cron.job order by jobname;
