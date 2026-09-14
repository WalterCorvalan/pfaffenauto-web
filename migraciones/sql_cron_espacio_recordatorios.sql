-- Programa el cron de recordatorios de Mi Espacio (calendario personal +
-- vencimientos de autos), mismo patrón que panel-v2-eventos-calendario
-- (jobid 7) pero 1 vez por día en vez de cada minuto -- no hace falta más
-- que eso para avisos de "vence en 7 días" o "recordame 1 semana antes".
select cron.schedule(
  'panel-v2-espacio-recordatorios',
  '0 8 * * *',
  $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/espacio-recordatorios?token=b3ec90977565359e55e1a6e9b55f092ecec20fe255d90cef602a05448b5e2863'
  );
  $$
);
