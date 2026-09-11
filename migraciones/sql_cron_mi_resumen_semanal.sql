-- Programa el cron del resumen semanal de performance (Mi Espacio →
-- Notificaciones → "logros"), lunes a las 8hs, sobre la semana que terminó.
select cron.schedule(
  'panel-v2-mi-resumen-semanal',
  '0 8 * * 1',
  $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/mi-resumen-semanal?token=33864dbc0cd53d5b4ce97526401c0fc22ef766f1831f1403'
  );
  $$
);
