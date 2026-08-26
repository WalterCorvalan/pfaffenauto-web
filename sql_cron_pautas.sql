-- Programa /api/cron/pautas (sincroniza Google Ads/Meta Ads/MercadoLibre)
-- cada hora. Mismo dominio y patrón que el cron "automatizaciones-whatsapp"
-- ya activo. Corré esto en el SQL Editor de Supabase.

select cron.schedule(
  'sync-pautas-publicitarias',
  '0 * * * *', -- cada hora, en punto
  $$
  select net.http_get(
    url := 'https://pfaffenautos.com.ar/api/cron/pautas?token=33864dbc0cd53d5b4ce97526401c0fc22ef766f1831f1403'
  );
  $$
);

-- ⚠️ De paso: el cron "automatizaciones-whatsapp" (jobid 1) tiene el token
-- literal "TU_CRON_SECRET" sin reemplazar por el valor real — nunca estuvo
-- autenticando bien, probablemente viene devolviendo 401 desde que se creó
-- (las automatizaciones de WhatsApp de /api/cron/automatizaciones no están
-- corriendo). Para arreglarlo:

select cron.alter_job(
  job_id := 1,
  command := $$
  select net.http_get(
    url := 'https://pfaffenautos.com.ar/api/cron/automatizaciones?token=33864dbc0cd53d5b4ce97526401c0fc22ef766f1831f1403'
  );
  $$
);
