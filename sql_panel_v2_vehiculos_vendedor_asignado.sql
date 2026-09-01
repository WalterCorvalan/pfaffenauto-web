-- Vendedor asignado al vehículo (distinto de consignado_por, que es quien
-- trajo la consignación). Columna nueva, nullable, 100% aditiva.
alter table public.vehiculos
  add column if not exists vendedor_asignado_id uuid references public.perfiles(id);

create index if not exists vehiculos_vendedor_asignado_idx on public.vehiculos(vendedor_asignado_id);
