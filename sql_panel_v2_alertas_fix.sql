-- Sin esto, un DELETE filtrado por destinatario_id no le llega al cliente
-- por Realtime (Postgres no manda la fila vieja completa por defecto, solo
-- la primary key) — el badge de la campana quedaba desactualizado al cerrar
-- una alerta.
alter table public.alertas replica identity full;
