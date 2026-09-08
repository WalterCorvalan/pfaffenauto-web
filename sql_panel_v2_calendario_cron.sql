-- Programa el pg_cron que llama a /api/cron/panel-v2/eventos cada 5 min.
-- Requiere las extensiones pg_cron y pg_net habilitadas en el proyecto
-- (Database > Extensions en Supabase Studio) -- si ya usás pg_cron para
-- otra cosa en este proyecto, ya deberían estar prendidas.

select cron.schedule(
  'panel-v2-eventos-calendario',
  '*/5 * * * *',
  $$
  select net.http_get(
    url := 'https://pfaffenautos.com.ar/api/cron/panel-v2/eventos?token=33864dbc0cd53d5b4ce97526401c0fc22ef766f1831f1403'
  );
  $$
);

-- Para desprogramarlo si hace falta: select cron.unschedule('panel-v2-eventos-calendario');
