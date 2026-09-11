-- Programa el cron de recordatorios de Mi Espacio (calendario personal +
-- vencimientos de autos), mismo patrón que panel-v2-eventos-calendario
-- (jobid 7) pero 1 vez por día en vez de cada minuto -- no hace falta más
-- que eso para avisos de "vence en 7 días" o "recordame 1 semana antes".
select cron.schedule(
  'panel-v2-espacio-recordatorios',
  '0 8 * * *',
  $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/espacio-recordatorios?token=33864dbc0cd53d5b4ce97526401c0fc22ef766f1831f1403'
  );
  $$
);
