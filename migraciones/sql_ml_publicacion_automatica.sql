-- Publicación automática en Mercado Libre: hasta ahora "publicado_ml" era
-- un campo manual (se tildaba a mano, sin ninguna acción real detrás) y
-- "link_ml" se pegaba a mano si alguien publicaba por fuera. Estas dos
-- columnas nuevas guardan el resultado real de publicar vía API:
--   ml_item_id     -> ID del aviso en MercadoLibre (MLAxxxxxxxxx), para
--                     poder actualizarlo/pausarlo después sin crear uno nuevo
--   ml_publicar_error -> último error de ML si la publicación falló (se
--                     muestra en el panel para que el staff sepa qué corregir)

alter table public.vehiculos add column if not exists ml_item_id text;
alter table public.vehiculos add column if not exists ml_publicar_error text;
