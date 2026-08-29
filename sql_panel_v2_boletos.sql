-- Panel v2 — Boletos (de venta / de compra). Documento simple que se genera
-- desde el expediente; no reemplaza el flujo grande de venta de v1
-- (boletos_venta), es solo el papel para firmar.

create table if not exists public.boletos (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid references public.expedientes(id) on delete cascade,
  venta_id uuid references public.ventas(id) on delete cascade,
  tipo text not null check (tipo in ('venta', 'compra')),
  fecha date not null default current_date,
  ciudad text,
  comprador_nombre text,
  comprador_dni text,
  comprador_telefono text,
  comprador_domicilio text,
  monto numeric,
  moneda text default 'ARS' check (moneda in ('USD', 'ARS')),
  vehiculo_marca text,
  vehiculo_tipo text,
  vehiculo_modelo text,
  vehiculo_motor text,
  vehiculo_chasis text,
  vehiculo_dominio text,
  vehiculo_km numeric,
  forma_pago text check (forma_pago in ('Contado', 'Permuta', 'Financiado', 'Otro')),
  forma_pago_detalle text,
  observaciones text,
  firma_nombre text,
  firma_dni text,
  agencia_nombre text,
  agencia_domicilio text,
  agencia_telefono text,
  agencia_cuit text,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists boletos_expediente_idx on public.boletos(expediente_id);
create index if not exists boletos_venta_idx on public.boletos(venta_id);

alter table public.boletos enable row level security;
drop policy if exists "equipo_boletos" on public.boletos;
create policy "equipo_boletos" on public.boletos for all to authenticated using (true) with check (true);
