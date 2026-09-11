-- Columnas de control para los avisos automáticos de Consignaciones,
-- Expedientes y Postventa (evitan re-avisar lo mismo todos los días).

alter table public.consignaciones add column if not exists aviso_sin_contacto_fecha date;
alter table public.expedientes add column if not exists aviso_por_vencer_enviado boolean not null default false;
alter table public.postventa_recordatorios add column if not exists aviso_enviado boolean not null default false;
alter table public.postventa_compras add column if not exists aviso_service_enviado boolean not null default false;
alter table public.configuracion_empresa add column if not exists resumen_diario_ultimo_envio date;
