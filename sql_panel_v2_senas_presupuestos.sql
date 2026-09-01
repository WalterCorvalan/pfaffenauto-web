-- Señas y presupuestos — v1 los tiene con ~40 columnas (prenda, permuta,
-- tesorería, remanente); acá se arma la versión simple que corresponde a lo
-- que el modal de Stock realmente pide (cliente, monto, vehículo, notas).
-- 100% aditivo, tablas nuevas.

create table if not exists public.senas (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid references public.vehiculos(id) on delete set null,
  cliente_nombre text not null,
  monto numeric,
  moneda text not null default 'USD' check (moneda in ('USD', 'ARS')),
  notas text,
  vendedor_id uuid references public.perfiles(id),
  estado text not null default 'activa' check (estado in ('activa', 'convertida', 'cancelada')),
  created_at timestamptz not null default now()
);

create index if not exists senas_vehiculo_idx on public.senas(vehiculo_id);
create index if not exists senas_vendedor_idx on public.senas(vendedor_id);

alter table public.senas enable row level security;
drop policy if exists "equipo_senas" on public.senas;
create policy "equipo_senas" on public.senas for all to authenticated using (true) with check (true);

create table if not exists public.presupuestos (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid references public.vehiculos(id) on delete set null,
  cliente_nombre text not null,
  precio_ars numeric,
  precio_usd numeric,
  observaciones text,
  vendedor_id uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists presupuestos_vehiculo_idx on public.presupuestos(vehiculo_id);
create index if not exists presupuestos_vendedor_idx on public.presupuestos(vendedor_id);

alter table public.presupuestos enable row level security;
drop policy if exists "equipo_presupuestos" on public.presupuestos;
create policy "equipo_presupuestos" on public.presupuestos for all to authenticated using (true) with check (true);
