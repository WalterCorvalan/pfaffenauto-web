alter table public.ventas
  add column if not exists codigo_seguimiento text unique;
