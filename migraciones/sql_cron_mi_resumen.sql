-- Programa el cron de "Mi resumen" (Mi Espacio), 1 vez por día a las 8hs,
-- mismo patrón que los otros crons de panel-v2.
select cron.schedule(
  'panel-v2-mi-resumen',
  '0 8 * * *',
  $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/mi-resumen?token=b3ec90977565359e55e1a6e9b55f092ecec20fe255d90cef602a05448b5e2863'
  );
  $$
);
