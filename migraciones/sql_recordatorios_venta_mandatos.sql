alter table public.venta_recordatorios add column if not exists aviso_enviado boolean not null default false;
alter table public.mandatos add column if not exists aviso_vencimiento_enviado boolean not null default false;
