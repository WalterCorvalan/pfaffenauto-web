-- Panel v2 — Taller. Corre en la base NUEVA (vdcpmbajlyqgohrwpkeo).
-- "Cobro a la caja" es tabla propia (taller_cobros) porque Tesorería
-- todavía no existe — se reconcilia cuando se construya. El peritaje del
-- auto reutiliza la tabla "peritajes" ya creada para Stock (mismo
-- vehiculo_id), no se duplica acá.

create table if not exists public.taller_mecanicos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.taller_servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  precio numeric,
  moneda text not null default 'USD' check (moneda in ('USD', 'ARS')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Config única del taller (capacidad, IVA, garantía por defecto, etc).
create table if not exists public.taller_config (
  id text primary key default 'default',
  capacidad_diaria int not null default 0,
  iva_pct numeric,
  extra_vendedor_pct numeric not null default 50,
  garantia_dias int,
  garantia_km int,
  validez_presupuesto_dias int not null default 0,
  condiciones_pago text,
  updated_at timestamptz not null default now()
);
insert into public.taller_config (id) values ('default') on conflict (id) do nothing;

create table if not exists public.taller_ordenes (
  id uuid primary key default gen_random_uuid(),
  tipo_orden text not null default 'externo' check (tipo_orden in ('externo', 'stock')),
  -- de dónde entró el pedido: define en qué solapa "sin presupuestar" aparece.
  origen text not null default 'taller' check (origen in ('web', 'vendedor', 'taller', 'bot')),
  vendedor_solicitante_id uuid references public.perfiles(id),
  cuando timestamptz not null default now(),
  moneda text not null default 'USD' check (moneda in ('USD', 'ARS')),

  cliente_id uuid references public.clientes(id),
  cliente_nombre text not null,
  cliente_telefono text,

  vehiculo_id uuid references public.vehiculos(id),
  marca text not null,
  modelo text not null,
  patente text,
  anio int,
  km_ingreso numeric,
  chasis text,

  mecanico_id uuid references public.taller_mecanicos(id),
  motivo_ingreso text,
  combustible_pct int,
  objetos_dejados text,
  danos_ingreso jsonb not null default '[]',
  fotos_ingreso text[] not null default '{}',

  estado text not null default 'ingresado' check (estado in ('ingresado', 'presupuestado', 'aprobado', 'en_proceso', 'cerrada')),

  -- venta con extra: el vendedor le cobra al cliente más que el costo de
  -- taller; la diferencia se reparte vendedor/agencia al cobrar.
  vendedor_extra_id uuid references public.perfiles(id),
  precio_cliente_final numeric,

  observacion_presupuesto text,
  presupuesto_valido_hasta date,
  compartido_en timestamptz,
  aprobado_en timestamptz,
  aprobado_parcial boolean not null default false,

  proximo_service_fecha date,
  proximo_service_km numeric,

  imputado_a_vehiculo boolean not null default false,

  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists taller_ordenes_estado_idx on public.taller_ordenes(estado);
create index if not exists taller_ordenes_patente_idx on public.taller_ordenes(patente);
create index if not exists taller_ordenes_vehiculo_idx on public.taller_ordenes(vehiculo_id);

-- Renglones del presupuesto: mano de obra / repuestos, costo interno vs
-- precio al cliente, y si el cliente lo aprobó (permite aprobación parcial).
create table if not exists public.taller_renglones (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references public.taller_ordenes(id) on delete cascade,
  tipo text not null check (tipo in ('mano_obra', 'repuesto')),
  descripcion text not null,
  costo numeric not null default 0,
  precio numeric not null default 0,
  aprobado_cliente boolean,
  created_at timestamptz not null default now()
);

create index if not exists taller_renglones_orden_idx on public.taller_renglones(orden_id);

-- Cobro a "Caja Taller" — tabla puente hasta que exista Tesorería real.
create table if not exists public.taller_cobros (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references public.taller_ordenes(id) on delete cascade,
  monto numeric not null,
  moneda text not null default 'USD' check (moneda in ('USD', 'ARS')),
  caja text not null default 'Caja Taller',
  fecha date not null default current_date,
  anulado boolean not null default false,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists taller_cobros_orden_idx on public.taller_cobros(orden_id);

-- RLS: mismo patrón que el resto de panel-v2 (equipo lee/escribe todo,
-- borrar solo admin). El vendedor solo debería ver SUS órdenes según el
-- manual ("el vendedor solo ve sus propias cotizaciones") — se resuelve en
-- el frontend filtrando por vendedor_solicitante_id/creado_por, no acá,
-- para no reproducir por SQL una regla de negocio que puede cambiar.
alter table public.taller_mecanicos enable row level security;
alter table public.taller_servicios enable row level security;
alter table public.taller_config enable row level security;
alter table public.taller_ordenes enable row level security;
alter table public.taller_renglones enable row level security;
alter table public.taller_cobros enable row level security;

drop policy if exists "ver_mecanicos" on public.taller_mecanicos;
create policy "ver_mecanicos" on public.taller_mecanicos for select to authenticated using (true);
drop policy if exists "editar_mecanicos" on public.taller_mecanicos;
create policy "editar_mecanicos" on public.taller_mecanicos for all to authenticated using (true) with check (true);

drop policy if exists "ver_servicios" on public.taller_servicios;
create policy "ver_servicios" on public.taller_servicios for select to authenticated using (true);
drop policy if exists "editar_servicios" on public.taller_servicios;
create policy "editar_servicios" on public.taller_servicios for all to authenticated using (true) with check (true);

drop policy if exists "ver_taller_config" on public.taller_config;
create policy "ver_taller_config" on public.taller_config for select to authenticated using (true);
drop policy if exists "editar_taller_config" on public.taller_config;
create policy "editar_taller_config" on public.taller_config for update to authenticated using (true) with check (true);

drop policy if exists "ver_ordenes" on public.taller_ordenes;
create policy "ver_ordenes" on public.taller_ordenes for select to authenticated using (true);
drop policy if exists "crear_ordenes" on public.taller_ordenes;
create policy "crear_ordenes" on public.taller_ordenes for insert to authenticated with check (true);
drop policy if exists "editar_ordenes" on public.taller_ordenes;
create policy "editar_ordenes" on public.taller_ordenes for update to authenticated using (true) with check (true);
drop policy if exists "borrar_ordenes" on public.taller_ordenes;
create policy "borrar_ordenes" on public.taller_ordenes for delete to authenticated
  using (exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles)));

drop policy if exists "ver_renglones" on public.taller_renglones;
create policy "ver_renglones" on public.taller_renglones for select to authenticated using (true);
drop policy if exists "editar_renglones" on public.taller_renglones;
create policy "editar_renglones" on public.taller_renglones for all to authenticated using (true) with check (true);

drop policy if exists "ver_cobros" on public.taller_cobros;
create policy "ver_cobros" on public.taller_cobros for select to authenticated using (true);
drop policy if exists "crear_cobros" on public.taller_cobros;
create policy "crear_cobros" on public.taller_cobros for insert to authenticated with check (true);
drop policy if exists "editar_cobros" on public.taller_cobros;
create policy "editar_cobros" on public.taller_cobros for update to authenticated using (true) with check (true);
