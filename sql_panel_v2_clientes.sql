-- Panel v2 — Clientes. Corre en la base NUEVA (vdcpmbajlyqgohrwpkeo).
-- Pipeline con 6 etapas fijas (sin_contactar/contactado/visita/negociacion/
-- cerrado/perdido) — el modal "Nuevo cliente" arranca todo en sin_contactar,
-- salvo que se cargue con un contacto ya hecho.
-- Vehículo de interés es texto libre por ahora: Stock (con matcheo real
-- contra vehiculo_id) todavía no existe en esta base.

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null default 'Regular',
  sexo text,
  dni_cuit text,
  telefono text,
  email text,
  origen text not null default 'Otro' check (origen in ('Instagram', 'Facebook', 'Web', 'Referido', 'Showroom', 'WhatsApp', 'Otro')),
  canal_ingreso text not null default 'lead_digital' check (canal_ingreso in ('walk_in', 'lead_digital')),
  vehiculo_interes_texto text,
  busca_marca text,
  busca_modelo text,
  busca_moneda text default 'USD',
  busca_anio_desde int,
  busca_anio_hasta int,
  busca_presupuesto_max numeric,
  fecha_nacimiento date,
  ultimo_contacto timestamptz,
  vendedor_id uuid references public.perfiles(id),
  direccion text,
  observaciones text,
  pipeline_stage text not null default 'sin_contactar' check (pipeline_stage in ('sin_contactar', 'contactado', 'visita', 'negociacion', 'cerrado', 'perdido')),
  pipeline_stage_motivo text,
  pipeline_stage_manual boolean not null default false,
  importado_excel boolean not null default false,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clientes_vendedor_idx on public.clientes(vendedor_id);
create index if not exists clientes_pipeline_idx on public.clientes(pipeline_stage);
create index if not exists clientes_created_idx on public.clientes(created_at);

alter table public.clientes enable row level security;

drop policy if exists "ver_clientes" on public.clientes;
create policy "ver_clientes" on public.clientes for select to authenticated using (true);

drop policy if exists "crear_clientes" on public.clientes;
create policy "crear_clientes" on public.clientes for insert to authenticated with check (true);

drop policy if exists "editar_clientes" on public.clientes;
create policy "editar_clientes" on public.clientes for update to authenticated using (true) with check (true);

drop policy if exists "borrar_clientes" on public.clientes;
create policy "borrar_clientes" on public.clientes for delete to authenticated
  using (exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles)));

-- Trazabilidad de contactos (llamada/visita/mensaje/nota) — historial
-- de la ficha, punto 4 del manual ("Registrá cada contacto").
create table if not exists public.cliente_actividades (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  tipo text not null default 'nota' check (tipo in ('llamada', 'visita', 'mensaje', 'nota', 'cambio_etapa')),
  descripcion text,
  autor_id uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists cliente_actividades_cliente_idx on public.cliente_actividades(cliente_id, created_at);

alter table public.cliente_actividades enable row level security;

drop policy if exists "ver_actividades" on public.cliente_actividades;
create policy "ver_actividades" on public.cliente_actividades for select to authenticated using (true);

drop policy if exists "crear_actividades" on public.cliente_actividades;
create policy "crear_actividades" on public.cliente_actividades for insert to authenticated with check (true);

-- "Mi disponibilidad" — punto 14: una fila por vendedor, se pisa (upsert)
-- cada vez que cambia. recibir_leads=false lo saca de la rotación de leads.
create table if not exists public.disponibilidad_vendedor (
  vendedor_id uuid primary key references public.perfiles(id) on delete cascade,
  estado text not null default 'disponible' check (estado in ('disponible', 'vacaciones', 'enfermo')),
  desde date,
  hasta date,
  recibir_leads boolean not null default true,
  actualizado_por uuid references public.perfiles(id),
  updated_at timestamptz not null default now()
);

alter table public.disponibilidad_vendedor enable row level security;

drop policy if exists "ver_disponibilidad" on public.disponibilidad_vendedor;
create policy "ver_disponibilidad" on public.disponibilidad_vendedor for select to authenticated using (true);

drop policy if exists "set_disponibilidad" on public.disponibilidad_vendedor;
create policy "set_disponibilidad" on public.disponibilidad_vendedor for insert to authenticated with check (true);

drop policy if exists "upd_disponibilidad" on public.disponibilidad_vendedor;
create policy "upd_disponibilidad" on public.disponibilidad_vendedor for update to authenticated using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'clientes'
  ) then
    alter publication supabase_realtime add table public.clientes;
  end if;
end $$;
