-- Pedido del 26/9: la oferta instantánea calculada con descuento fijo por km
-- sobre el precio que puso el cliente se sacó del formulario público
-- (/cotizador) -- no había ningún ancla de mercado real. En su lugar, al
-- recibir la cotización se busca un precio de referencia real por web
-- (ver lib/ai/estimarPrecioMercado.ts) y se guarda acá para que el asesor lo
-- compare en el panel (Cotizaciones) contra lo que pidió el cliente, antes
-- de comunicarle una oferta.
ALTER TABLE leads_tasacion ADD COLUMN IF NOT EXISTS precio_mercado_estimado numeric;
ALTER TABLE leads_tasacion ADD COLUMN IF NOT EXISTS precio_mercado_fuentes text[];
