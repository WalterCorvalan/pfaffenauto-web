-- Columnas de control para los avisos automáticos de Reclamos (estancados y
-- "pedido de atención" -- este último también estaba roto: el botón nunca
-- actualizaba pedido_atencion_sector/pedido_atencion_mensaje, ya se arregló
-- en código), Tareas de leads y Cuotas (a cobrar / a pagar).

alter table public.reclamos add column if not exists aviso_estancado_fecha timestamptz;
alter table public.tareas_lead add column if not exists aviso_vencida_enviado boolean not null default false;
alter table public.cuotas_cobrar_clientes add column if not exists aviso_vencimiento_enviado boolean not null default false;
alter table public.cuotas_pagar_agencia add column if not exists aviso_vencimiento_enviado boolean not null default false;
