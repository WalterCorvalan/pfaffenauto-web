-- 1 vez por día, 09:00 Argentina (12:00 UTC): archiva automáticamente las
-- conversaciones de WhatsApp/Instagram sin actividad hace 20 días.
-- Pedido de la reunión del 22/9.
-- Reemplazá REEMPLAZAR_CON_CRON_SECRET por el valor real de CRON_SECRET.
select cron.schedule(
  'panel-archivado-chats',
  '0 12 * * *',
  $$ select net.http_get('https://www.pfaffencars.com/api/cron/panel/archivado-chats?token=REEMPLAZAR_CON_CRON_SECRET'); $$
);
