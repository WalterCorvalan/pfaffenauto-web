-- Simulador propio de Financiaciones: descuento aproximado de la 1ª cuota
-- UVA vs Tradicional (solo aplica hasta 24 cuotas en decreditos), derivado
-- comparando la grilla real (Tradicional Desde vs UVA Desde) para un mismo
-- capital/plazo. Ver lib/panel/financiacion.ts.

alter table public.configuracion_empresa
  add column if not exists financiacion_uva_descuento jsonb not null default '{"12": 9.1, "18": 10.3, "24": 10.5}'::jsonb;
