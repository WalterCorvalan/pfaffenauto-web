-- Programa el cron nuevo de matching automático de Pedidos (cada hora).
--
-- Dominio: pfaffenauto-web.vercel.app, NO www.pfaffencars.com -- ese es el
-- dominio "definitivo" pero hoy no es el que resuelve a este deploy (ver
-- migraciones/sql_fix_dominio_crons_vercel.sql, que corrige los cron jobs
-- viejos que sí apuntaban mal a pfaffencars.com). Si en algún momento
-- pfaffencars.com pasa a apuntar acá de verdad, hay que volver a mover
-- este cron (y todos los demás) a ese dominio.
--
-- IMPORTANTE: reemplazá <CRON_SECRET> por el valor real de la variable de
-- entorno CRON_SECRET del proyecto (Vercel → Settings → Environment
-- Variables) antes de correr esto -- no lo pego acá a propósito para no
-- dejar el secreto en texto plano en este archivo commiteado (a diferencia
-- de otras migraciones de cron ya commiteadas con el token real expuesto,
-- que convendría rotar en algún momento).

select cron.schedule(
  'panel-v2-pedidos-match',
  '0 * * * *',
  $$
  select net.http_get(
    url := 'https://pfaffenauto-web.vercel.app/api/cron/panel-v2/pedidos-match?token=<CRON_SECRET>'
  );
  $$
);
