-- Simulador propio (aproximado) de Financiaciones: tope de financiación por
-- año, TNA estimada por plazo y % de gastos, todo editable desde
-- Configuración → Empresa → Financiación. Los defaults acá abajo son la
-- tabla confirmada probando el simulador real de decreditos año por año.

alter table public.configuracion_empresa
  add column if not exists financiacion_topes jsonb not null default '[
    {"anioDesde": 0, "anioHasta": 2015, "pct": 50},
    {"anioDesde": 2016, "anioHasta": 2017, "pct": 55},
    {"anioDesde": 2018, "anioHasta": 2020, "pct": 60},
    {"anioDesde": 2021, "anioHasta": 9999, "pct": 65}
  ]'::jsonb;

alter table public.configuracion_empresa
  add column if not exists financiacion_tope_0km numeric not null default 70;

alter table public.configuracion_empresa
  add column if not exists financiacion_tna jsonb not null default '{"12": 76, "18": 70, "24": 65, "36": 60, "48": 57}'::jsonb;

alter table public.configuracion_empresa
  add column if not exists financiacion_gastos_pct numeric not null default 11;
