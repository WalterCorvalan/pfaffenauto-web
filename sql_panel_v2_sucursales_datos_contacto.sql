-- Suma a sucursales los datos que el agente de IA (WhatsApp/Rodi) necesita
-- para responder con confianza cuándo el cliente pregunta "qué sucursal me
-- queda más cerca" o pide la dirección/teléfono — antes no existían y el
-- bot no tenía de dónde sacar esa info (inventaba o decía que no la tenía).

alter table public.sucursales
  add column if not exists direccion text,
  add column if not exists telefono_encargado text,
  add column if not exists google_maps_url text;
