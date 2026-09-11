-- Los webhooks de WhatsApp/Rodi insertan "puertas" en pedidos (parte del
-- pedido_stock que arma el bot cuando el cliente busca algo con cantidad de
-- puertas puntual y no hay stock) pero la columna nunca existió en esta
-- tabla -- PostgREST rechazaba el insert COMPLETO por una columna
-- desconocida, así que NINGÚN pedido se creaba desde el bot, nunca, sea cual
-- fuera el resto de los datos.

alter table public.pedidos add column if not exists puertas integer;
