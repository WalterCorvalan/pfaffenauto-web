-- Cada 3 minutos: reenvía por WhatsApp personal las notificaciones de quien
-- activó "whatsapp_forward" en Mi Espacio → Notificaciones (ver
-- migraciones/sql_notificaciones_whatsapp_forward.sql -- correr ESE
-- primero, agrega las columnas que este cron necesita).
-- Reemplazá REEMPLAZAR_CON_CRON_SECRET por el valor real de CRON_SECRET.
select cron.schedule(
  'panel-notificar-whatsapp-vendedores',
  '*/3 * * * *',
  $$ select net.http_get('https://www.pfaffencars.com/api/cron/panel/notificar-whatsapp-vendedores?token=REEMPLAZAR_CON_CRON_SECRET'); $$
);
