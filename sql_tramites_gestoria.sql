-- Entidad Trámite (Gestoría, punto 3): separa "trámite de gestoría" de
-- "venta". Antes solo existía boletos_venta.etapa_seguimiento (6 etapas
-- planas, sin historial ni tercerización) — esto agrega tipo, responsable,
-- si lo hace gestoría propia o un tercero (con nombre), y guarda cada
-- cambio de estado con fecha/hora/responsable.

create table if not exists public.tramites_gestoria (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid not null references public.vehiculos(id) on delete cascade,
  venta_id uuid references public.boletos_venta(id) on delete set null,
  tipo_tramite text not null default 'Transferencia',
  fecha_ingreso date not null default current_date,
  fecha_estimada_fin date,
  estado text not null default 'Nuevo',
  responsable_id uuid references public.perfiles(id),
  modalidad text not null default 'Gestoría propia',
  realizado_por text,
  observaciones text,
  proxima_tarea text,
  proxima_fecha date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tramites_gestoria drop constraint if exists tramites_gestoria_tipo_check;
alter table public.tramites_gestoria add constraint tramites_gestoria_tipo_check
  check (tipo_tramite in ('Transferencia', 'Patentamiento', 'Alta', 'Baja', 'Otro'));

alter table public.tramites_gestoria drop constraint if exists tramites_gestoria_estado_check;
alter table public.tramites_gestoria add constraint tramites_gestoria_estado_check
  check (estado in (
    'Nuevo', 'Pendiente de documentación', 'Listo para iniciar', 'Iniciado',
    'En curso', 'Esperando pago o respuesta', 'Finalizado', 'Listo para retirar', 'Entregado'
  ));

alter table public.tramites_gestoria drop constraint if exists tramites_gestoria_modalidad_check;
alter table public.tramites_gestoria add constraint tramites_gestoria_modalidad_check
  check (modalidad in ('Gestoría propia', 'Gestor propio', 'Concesionario externo', 'Otro'));

create index if not exists tramites_gestoria_vehiculo_id_idx on public.tramites_gestoria(vehiculo_id);
create index if not exists tramites_gestoria_venta_id_idx on public.tramites_gestoria(venta_id);
create index if not exists tramites_gestoria_estado_idx on public.tramites_gestoria(estado);

create table if not exists public.tramites_gestoria_historial (
  id uuid primary key default gen_random_uuid(),
  tramite_id uuid not null references public.tramites_gestoria(id) on delete cascade,
  estado_anterior text,
  estado_nuevo text not null,
  responsable_id uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists tramites_gestoria_historial_tramite_id_idx on public.tramites_gestoria_historial(tramite_id);

alter table public.tramites_gestoria enable row level security;
alter table public.tramites_gestoria_historial enable row level security;

drop policy if exists "acceso_autenticados" on public.tramites_gestoria;
create policy "acceso_autenticados" on public.tramites_gestoria for all to authenticated
  using (true) with check (true);

drop policy if exists "acceso_autenticados" on public.tramites_gestoria_historial;
create policy "acceso_autenticados" on public.tramites_gestoria_historial for all to authenticated
  using (true) with check (true);
