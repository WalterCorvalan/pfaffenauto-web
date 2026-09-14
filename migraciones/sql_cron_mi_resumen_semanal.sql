-- Programa el cron del resumen semanal de performance (Mi Espacio →
-- Notificaciones → "logros"), lunes a las 8hs, sobre la semana que terminó.
select cron.schedule(
  'panel-v2-mi-resumen-semanal',
  '0 8 * * 1',
  $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/mi-resumen-semanal?token=b3ec90977565359e55e1a6e9b55f092ecec20fe255d90cef602a05448b5e2863'
  );
  $$
);
