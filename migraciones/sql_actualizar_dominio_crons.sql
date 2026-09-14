-- Actualiza los 2 cron jobs que apuntaban al dominio viejo de Vercel, ahora
-- que el dominio real es www.pfaffencars.com.
select cron.alter_job(
  job_id := 7,
  command := $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/eventos?token=b3ec90977565359e55e1a6e9b55f092ecec20fe255d90cef602a05448b5e2863'
  );
  $$
);

select cron.alter_job(
  job_id := 8,
  command := $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/espacio-recordatorios?token=b3ec90977565359e55e1a6e9b55f092ecec20fe255d90cef602a05448b5e2863'
  );
  $$
);
