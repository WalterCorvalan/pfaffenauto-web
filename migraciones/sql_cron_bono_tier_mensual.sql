-- Programa el cron que liquida el bono retroactivo por tier del mes
-- anterior. Corre todos los días a las 9hs pero el endpoint se autolimita a
-- solo hacer algo el día 1 de cada mes (mismo patrón que los demás crons).
select cron.schedule(
  'panel-v2-bono-tier-mensual',
  '0 9 * * *',
  $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/bono-tier-mensual?token=33864dbc0cd53d5b4ce97526401c0fc22ef766f1831f1403'
  );
  $$
);
