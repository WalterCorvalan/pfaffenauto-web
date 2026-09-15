-- Programa el cron de sincronización de pautas (Meta Ads, Google Ads,
-- MercadoLibre) de panel-v2 -- portado de api/cron/pautas/route.ts (v1,
-- borrado), que corría contra la base vieja y por eso /panel/marketing/pautas
-- (que lee de la base nueva) nunca se llenaba solo. Cada 1-2hs, como
-- pensaba el comentario original.
select cron.schedule(
  'panel-v2-pautas',
  '0 */2 * * *',
  $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/pautas?token=b3ec90977565359e55e1a6e9b55f092ecec20fe255d90cef602a05448b5e2863'
  );
  $$
);
