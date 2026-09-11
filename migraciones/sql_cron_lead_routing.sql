-- Programa el cron de reasignación de leads sin contactar. Corre cada 10
-- minutos, matching el texto que ya mostraba la UI en Configuración >
-- Empresa ("Corre cada 10 minutos") -- el endpoint mismo respeta
-- lead_routing_activo (si está apagado, no hace nada).
select cron.schedule(
  'panel-v2-lead-routing',
  '*/10 * * * *',
  $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/lead-routing?token=33864dbc0cd53d5b4ce97526401c0fc22ef766f1831f1403'
  );
  $$
);
