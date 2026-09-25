-- Antes de correr esto: reemplazá TODAS las apariciones de
-- REEMPLAZAR_CON_CRON_SECRET por tu valor real de CRON_SECRET (Vercel →
-- pfaffenauto-web → Settings → Environment Variables). Podés hacerlo con
-- buscar y reemplazar en el editor antes de ejecutar.
--
-- cron.schedule() con un nombre que ya existe actualiza ese job en vez de
-- duplicarlo -- correr este script de nuevo más adelante (por ej. si
-- rotás el CRON_SECRET) es seguro, no crea jobs repetidos.
--
-- Todos los horarios están en UTC (pg_cron no sabe de zona horaria).
-- Argentina es UTC-3 todo el año (sin horario de verano), así que le resto
-- 3 horas a la hora que quiero en Argentina para obtener el horario UTC.

-- Cada 5 minutos: recordatorios de eventos de Calendario a la hora exacta.
select cron.schedule(
  'panel-eventos',
  '*/5 * * * *',
  $$ select net.http_get('https://www.pfaffencars.com/api/cron/panel/eventos?token=REEMPLAZAR_CON_CRON_SECRET'); $$
);

-- Cada 30 minutos: matchea pedidos activos contra stock nuevo.
select cron.schedule(
  'panel-pedidos-match',
  '*/30 * * * *',
  $$ select net.http_get('https://www.pfaffencars.com/api/cron/panel/pedidos-match?token=REEMPLAZAR_CON_CRON_SECRET'); $$
);

-- Cada 5 minutos: reenvía por WhatsApp personal las notificaciones de quien
-- activó "whatsapp_forward" en Mi Espacio → Notificaciones (ver
-- migraciones/sql_notificaciones_whatsapp_forward.sql).
select cron.schedule(
  'panel-notificar-whatsapp-vendedores',
  '*/5 * * * *',
  $$ select net.http_get('https://www.pfaffencars.com/api/cron/panel/notificar-whatsapp-vendedores?token=REEMPLAZAR_CON_CRON_SECRET'); $$
);

-- Cada hora: 4 automatizaciones de WhatsApp (agradecimiento de venta, nudges, etc).
select cron.schedule(
  'panel-automatizaciones',
  '0 * * * *',
  $$ select net.http_get('https://www.pfaffencars.com/api/cron/panel/automatizaciones?token=REEMPLAZAR_CON_CRON_SECRET'); $$
);

-- Cada hora: sincroniza gasto/clics/leads de Meta Ads, Google Ads y MercadoLibre.
select cron.schedule(
  'panel-pautas',
  '0 * * * *',
  $$ select net.http_get('https://www.pfaffencars.com/api/cron/panel/pautas?token=REEMPLAZAR_CON_CRON_SECRET'); $$
);

-- 1 vez por día, 08:00 Argentina (11:00 UTC): "Mi resumen" diario de cada
-- usuario -- para admins incluye también el bloque de empresa completa
-- (ventas/leads/caja de todos) que antes mandaba un cron aparte
-- ("panel-resumen-empresa", dado de baja, ver sql_unschedule_resumen_empresa.sql)
-- como una alerta separada.
select cron.schedule(
  'panel-mi-resumen',
  '0 11 * * *',
  $$ select net.http_get('https://www.pfaffencars.com/api/cron/panel/mi-resumen?token=REEMPLAZAR_CON_CRON_SECRET'); $$
);

-- 1 vez por día, 08:10 Argentina (11:10 UTC): recordatorios de Mi Espacio (eventos/vencimientos).
select cron.schedule(
  'panel-espacio-recordatorios',
  '10 11 * * *',
  $$ select net.http_get('https://www.pfaffencars.com/api/cron/panel/espacio-recordatorios?token=REEMPLAZAR_CON_CRON_SECRET'); $$
);

-- 1 vez por día, 08:20 Argentina (11:20 UTC): seguimientos (cuotas por vencer, expedientes atrasados, etc).
select cron.schedule(
  'panel-seguimientos',
  '20 11 * * *',
  $$ select net.http_get('https://www.pfaffencars.com/api/cron/panel/seguimientos?token=REEMPLAZAR_CON_CRON_SECRET'); $$
);

-- 1 vez por día, 08:30 Argentina (11:30 UTC): alerta 3 días antes del vencimiento de un cheque.
select cron.schedule(
  'panel-cheques-alerta-vencimiento',
  '30 11 * * *',
  $$ select net.http_get('https://www.pfaffencars.com/api/cron/panel/cheques-alerta-vencimiento?token=REEMPLAZAR_CON_CRON_SECRET'); $$
);

-- 1 vez por día, 08:35 Argentina (11:35 UTC): cheque "a cobrar" que llegó a su fecha.
select cron.schedule(
  'panel-cheques-depositar',
  '35 11 * * *',
  $$ select net.http_get('https://www.pfaffencars.com/api/cron/panel/cheques-depositar?token=REEMPLAZAR_CON_CRON_SECRET'); $$
);

-- 1 vez por semana, lunes 08:40 Argentina (11:40 UTC): resumen semanal de performance.
select cron.schedule(
  'panel-mi-resumen-semanal',
  '40 11 * * 1',
  $$ select net.http_get('https://www.pfaffencars.com/api/cron/panel/mi-resumen-semanal?token=REEMPLAZAR_CON_CRON_SECRET'); $$
);

-- 1 vez por día, 08:45 Argentina (11:45 UTC): centraliza cuotas/pagos/préstamos
-- vencidos sin resolver en Finanzas en una sola alerta (no incluye cheques,
-- que ya tienen su propio aviso arriba).
select cron.schedule(
  'panel-finanzas-vencimientos',
  '45 11 * * *',
  $$ select net.http_get('https://www.pfaffencars.com/api/cron/panel/finanzas-vencimientos?token=REEMPLAZAR_CON_CRON_SECRET'); $$
);

-- Para revisar que quedaron todos cargados:
-- select jobname, schedule, active from cron.job order by jobname;
