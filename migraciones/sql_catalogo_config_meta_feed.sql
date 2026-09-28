-- Credenciales para forzar la resincronizacion del feed de Meta (Instagram/
-- Facebook Shop) desde el boton "Publicar en todos lados" de Stock, sin
-- esperar el pull automatico diario de Meta. Mismo criterio de cifrado que
-- whatsapp_configuracion.token_cifrado (lib/crypto).
alter table catalogo_config
  add column if not exists meta_feed_id text,
  add column if not exists meta_token_cifrado text,
  add column if not exists meta_token_iv text,
  add column if not exists meta_token_tag text;
