alter table public.configuracion_empresa
  add column if not exists sla_cotizacion_horas numeric not null default 48,
  add column if not exists stock_dias_estancado numeric not null default 90;
