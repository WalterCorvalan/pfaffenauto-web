-- Corrige el dominio en los 2 cron jobs — se habían creado con
-- pfaffenautos.com.ar por error, el dominio real es pfaffenautos.com (sin .ar).

select cron.alter_job(
  job_id := (select jobid from cron.job where jobname = 'sync-pautas-publicitarias'),
  command := $$
  select net.http_get(
    url := 'https://pfaffenautos.com/api/cron/pautas?token=33864dbc0cd53d5b4ce97526401c0fc22ef766f1831f1403'
  );
  $$
);

select cron.alter_job(
  job_id := (select jobid from cron.job where jobname = 'automatizaciones-whatsapp'),
  command := $$
  select net.http_get(
    url := 'https://pfaffenautos.com/api/cron/automatizaciones?token=33864dbc0cd53d5b4ce97526401c0fc22ef766f1831f1403'
  );
  $$
);

-- Para confirmar que quedó bien:
--   select jobname, command from cron.job;
