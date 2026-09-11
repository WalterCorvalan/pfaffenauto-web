-- Programa el cron de "Mi resumen" (Mi Espacio), 1 vez por día a las 8hs,
-- mismo patrón que los otros crons de panel-v2.
select cron.schedule(
  'panel-v2-mi-resumen',
  '0 8 * * *',
  $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/mi-resumen?token=33864dbc0cd53d5b4ce97526401c0fc22ef766f1831f1403'
  );
  $$
);
