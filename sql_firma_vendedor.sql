alter table public.boletos_venta
  add column if not exists firma_vendedor_url text;

alter table public.senas
  add column if not exists firma_vendedor_url text;
