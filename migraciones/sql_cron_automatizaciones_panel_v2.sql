-- Programa el cron de automatizaciones de panel-v2 (lead caliente sin
-- atender 24h+, agradecimiento post-venta, nudge de silencio 30-45min,
-- documentación pendiente 5+ días en un expediente) -- portado de
-- api/cron/automatizaciones/route.ts (v1, borrado), que corría cada 15
-- minutos contra la base vieja. Mismo intervalo acá (el nudge necesita
-- esa granularidad para no perderse la ventana de 30-45 min).
select cron.schedule(
  'panel-v2-automatizaciones',
  '*/15 * * * *',
  $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/automatizaciones?token=b3ec90977565359e55e1a6e9b55f092ecec20fe255d90cef602a05448b5e2863'
  );
  $$
);

-- El cron viejo (api/cron/automatizaciones, ruta ya borrada) corría contra
-- el proyecto Supabase v1 (otra base, otro pg_cron) -- no hay nada que
-- desprogramar acá. Si en algún momento se armó un cron.schedule apuntando
-- a esa ruta vieja EN ESTE proyecto (poco probable, pero por si acaso),
-- buscarlo con `select * from cron.job;` y desprogramarlo a mano con
-- `select cron.unschedule('<jobname>');`.
