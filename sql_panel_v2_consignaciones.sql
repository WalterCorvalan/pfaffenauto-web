-- Panel v2 — Consignaciones. Solo backend, corre en la base nova.

-- % de toma configurable por la agencia (no hardcodeado en el código).
alter table public.configuracion_empresa
  add column if not exists pct_toma_consignacion numeric not null default 70;

create table if not exists public.consignaciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id),
  cliente_nombre text not null,
  cliente_telefono text,
  vehiculo_descripcion text not null,
  vehiculo_id uuid references public.vehiculos(id),
  vendedor_id uuid references public.perfiles(id),
  estado text not null default 'pendiente_contacto' check (estado in ('pendiente_contacto', 'contactado', 'agendado', 'ingreso_local', 'publicado', 'cancelado', 'consignado')),
  publicada boolean not null default false,
  ultimo_contacto date,
  observaciones text,
  fecha_alta date not null default current_date,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists consignaciones_estado_idx on public.consignaciones(estado);
create index if not exists consignaciones_vendedor_idx on public.consignaciones(vendedor_id);

alter table public.consignaciones enable row level security;
drop policy if exists "equipo_consignaciones" on public.consignaciones;
create policy "equipo_consignaciones" on public.consignaciones for all to authenticated using (true) with check (true);

-- Avisa al vendedor asignado cuando se crea una consignación nueva.
create or replace function public.notificar_consignacion_nueva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.vendedor_id is not null then
    insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
    values (new.vendedor_id, 'consignacion_nueva', 'novedad', 'Nueva consignación asignada — ' || new.cliente_nombre, new.vehiculo_descripcion, '/panel-v2/consignaciones?consignacion=' || new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notificar_consignacion_nueva on public.consignaciones;
create trigger trg_notificar_consignacion_nueva
  after insert on public.consignaciones
  for each row execute function public.notificar_consignacion_nueva();
