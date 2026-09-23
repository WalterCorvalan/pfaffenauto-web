-- 1 vez por día, 08:45 Argentina (11:45 UTC): centraliza cuotas/pagos/préstamos
-- vencidos sin resolver en Finanzas en una sola alerta (no incluye cheques,
-- que ya tienen su propio aviso en panel-cheques-alerta-vencimiento).
-- Reemplazá REEMPLAZAR_CON_CRON_SECRET por el valor real de CRON_SECRET.
select cron.schedule(
  'panel-finanzas-vencimientos',
  '45 11 * * *',
  $$ select net.http_get('https://www.pfaffencars.com/api/cron/panel/finanzas-vencimientos?token=REEMPLAZAR_CON_CRON_SECRET'); $$
);
