-- Soporte para: filtro por cantidad de puertas en la búsqueda del bot,
-- CUIL del cliente cuando pide financiación, y criterio de puertas al
-- registrar un pedido de stock que no está disponible todavía.

alter table public.whatsapp_contactos add column if not exists cuil text;
alter table public.rodi_conversaciones add column if not exists cuil text;
alter table public.pedidos add column if not exists puertas smallint;

-- vehiculos.puertas ya existe (confirmado), pero hoy está vacío en todo el
-- stock -- el filtro del bot no va a encontrar nada por puertas hasta que se
-- cargue ese dato en Stock.
