alter table public.configuracion_empresa
  add column if not exists modo_comision text not null default 'porcentaje' check (modo_comision in ('porcentaje','fijo','ninguna')),
  add column if not exists comision_vendedor_pct_default numeric not null default 1,
  add column if not exists comision_consignacion_pct_default numeric not null default 0.5,
  add column if not exists monto_fijo_comision numeric not null default 0,
  add column if not exists comision_presets numeric[] not null default '{1,1.5,0.5}';
