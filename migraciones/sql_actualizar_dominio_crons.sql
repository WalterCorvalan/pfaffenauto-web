-- Actualiza los 2 cron jobs que apuntaban al dominio viejo de Vercel, ahora
-- que el dominio real es www.pfaffencars.com.
select cron.alter_job(
  job_id := 7,
  command := $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/eventos?token=33864dbc0cd53d5b4ce97526401c0fc22ef766f1831f1403'
  );
  $$
);

select cron.alter_job(
  job_id := 8,
  command := $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/espacio-recordatorios?token=33864dbc0cd53d5b4ce97526401c0fc22ef766f1831f1403'
  );
  $$
);
