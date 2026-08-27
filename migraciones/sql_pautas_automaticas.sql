-- Soporte para sincronización automática de Google Ads / Meta Ads /
-- MercadoLibre en campanas_marketing (ver app/api/cron/pautas/route.ts).
--
-- campana_externa_id: id de la campaña en la plataforma de origen — permite
-- hacer upsert (un row por campaña por día) en vez de duplicar filas cada
-- vez que corre el cron.
-- origen: "manual" (default, lo que ya carga el botón "Cargar Métricas") vs
-- "automatico" (lo que trae el cron) — para poder distinguir en la UI de dónde
-- vino cada fila si hace falta.
alter table campanas_marketing
  add column if not exists campana_externa_id text,
  add column if not exists origen text not null default 'manual';

-- Único por plataforma+campaña+día, pero solo cuando hay campana_externa_id
-- (las cargas manuales no tienen ese id y no deben chocar entre sí).
create unique index if not exists campanas_marketing_externa_unica
  on campanas_marketing (plataforma, campana_externa_id, periodo)
  where campana_externa_id is not null;
