-- Faltaban las columnas de firma digital en senas y presupuestos (FirmaCanvas
-- las necesita). Aditivo.
alter table public.senas
  add column if not exists firma_url text,
  add column if not exists firma_vendedor_url text;
