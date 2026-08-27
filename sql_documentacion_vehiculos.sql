-- Legajo documental por vehículo (Gestoría, punto 2 del requerimiento): a
-- diferencia de documentacion_ventas (cuelga de venta_id, solo existe una vez
-- que hay boleto), esto cuelga de vehiculo_id — permite controlar papeles de
-- un auto de permuta/consignación ANTES de que exista una venta.

create table if not exists public.documentacion_vehiculos (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid not null references public.vehiculos(id) on delete cascade,
  tipo_documento text not null,
  estado text not null default 'Pendiente',
  fecha_recibido date,
  vencimiento date,
  observacion text,
  created_at timestamptz not null default now()
);

alter table public.documentacion_vehiculos drop constraint if exists documentacion_vehiculos_estado_check;
alter table public.documentacion_vehiculos add constraint documentacion_vehiculos_estado_check
  check (estado in ('Recibido', 'Pendiente', 'No corresponde', 'Vencido'));

create index if not exists documentacion_vehiculos_vehiculo_id_idx on public.documentacion_vehiculos(vehiculo_id);

-- Evita que dos requests simultáneos (prefetch + navegación real, típico en
-- Next.js) siembren el checklist dos veces para el mismo auto.
alter table public.documentacion_vehiculos drop constraint if exists documentacion_vehiculos_vehiculo_tipo_key;
alter table public.documentacion_vehiculos add constraint documentacion_vehiculos_vehiculo_tipo_key
  unique (vehiculo_id, tipo_documento);

create table if not exists public.documentacion_vehiculos_archivos (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.documentacion_vehiculos(id) on delete cascade,
  url text not null,
  nombre_archivo text,
  created_at timestamptz not null default now()
);

create index if not exists documentacion_vehiculos_archivos_documento_id_idx on public.documentacion_vehiculos_archivos(documento_id);

alter table public.documentacion_vehiculos enable row level security;
alter table public.documentacion_vehiculos_archivos enable row level security;

drop policy if exists "acceso_autenticados" on public.documentacion_vehiculos;
create policy "acceso_autenticados" on public.documentacion_vehiculos for all to authenticated
  using (true) with check (true);

drop policy if exists "acceso_autenticados" on public.documentacion_vehiculos_archivos;
create policy "acceso_autenticados" on public.documentacion_vehiculos_archivos for all to authenticated
  using (true) with check (true);
