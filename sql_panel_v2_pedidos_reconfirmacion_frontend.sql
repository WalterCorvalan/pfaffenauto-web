-- Panel v2 — habilita el frontend de reconfirmación de Pedidos: la nota
-- alcanza para resetear el timer de aviso, no hace falta un comprobante
-- imprimible por ahora, así que print_url deja de ser obligatorio.
alter table public.pedidos_reconfirmaciones alter column print_url drop not null;
