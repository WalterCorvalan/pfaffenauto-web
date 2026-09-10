-- El bot (panel-v2) ahora puede mandar fotos reales del auto (no solo un
-- link) -- hace falta un lugar para guardar la URL de la imagen enviada.
alter table public.whatsapp_mensajes add column if not exists media_url text;
