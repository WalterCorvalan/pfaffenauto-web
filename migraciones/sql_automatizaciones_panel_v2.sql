-- Columnas de dedup para las 4 automatizaciones portadas de v1
-- (app/api/cron/automatizaciones/route.ts, ahora borrado) a
-- app/api/cron/panel-v2/automatizaciones/route.ts. Mismo patrón que el
-- resto de los cron de panel-v2 (aviso_vencimiento_enviado, etc.): un
-- flag boolean en la fila de origen, no una tabla de dedup aparte.
--
-- Correr este SQL una sola vez en el editor SQL de Supabase.

alter table public.whatsapp_conversaciones
  add column if not exists aviso_caliente_sin_atender_enviado boolean not null default false,
  add column if not exists aviso_nudge_enviado boolean not null default false;

alter table public.ventas
  add column if not exists aviso_agradecimiento_enviado boolean not null default false;

alter table public.expedientes
  add column if not exists aviso_doc_pendiente_enviado boolean not null default false;
