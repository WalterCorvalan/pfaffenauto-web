-- Peritajes: cada ítem del checklist (parabrisas, paragolpe, etc.) solo
-- permitía adjuntar UNA foto (columna foto_url, texto simple). Se agrega
-- fotos_urls (array) para poder subir varias por ítem, migrando lo que ya
-- había cargado en foto_url para no perder fotos existentes.

alter table public.peritaje_lead_items
  add column if not exists fotos_urls text[] not null default '{}';

update public.peritaje_lead_items
  set fotos_urls = array[foto_url]
  where foto_url is not null and foto_url <> '' and fotos_urls = '{}';
