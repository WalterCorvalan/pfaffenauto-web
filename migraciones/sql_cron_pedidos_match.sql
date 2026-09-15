-- Programa el cron nuevo de matching automático de Pedidos (cada hora).
--
-- IMPORTANTE: reemplazá <CRON_SECRET> por el valor real de la variable de
-- entorno CRON_SECRET del proyecto (Vercel → Settings → Environment
-- Variables) antes de correr esto -- no lo pego acá a propósito para no
-- dejar el secreto en texto plano en este archivo commiteado. Usá el
-- mismo token que ya usan los otros cron.schedule (ver
-- migraciones/sql_cron_seguimientos_y_resumen_empresa.sql como referencia
-- de formato, con SU token real ya commiteado ahí -- vale la pena rotarlo
-- en algún momento ya que quedó expuesto en el repo).

select cron.schedule(
  'panel-v2-pedidos-match',
  '0 * * * *',
  $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/pedidos-match?token=<CRON_SECRET>'
  );
  $$
);
