-- Panel v2 — Ventas. Corre en la base NUEVA (vdcpmbajlyqgohrwpkeo).
-- Gestoría/Tesorería/Finanzas todavía no existen: "expediente" y "cuotas"
-- quedan como tablas mínimas que ese trabajo futuro va a leer/expandir,
-- no como UI completa. Acá solo se generan cuando corresponde.

create table if not exists public.ventas (
  id uuid primary key default gen_random_uuid(),
  estado text not null default 'borrador' check (estado in ('borrador', 'activa', 'reserva', 'cerrada', 'caida', 'cancelada')),
  carga_manual boolean not null default false,
  abre_expediente boolean not null default true,
  vehiculo_id uuid references public.vehiculos(id),
  vehiculo_marca text,
  vehiculo_modelo text,
  vehiculo_anio int,
  vehiculo_patente text,
  vehiculo_color text,
  vehiculo_condicion text,
  km numeric,
  precio_venta numeric not null,
  moneda_venta text not null default 'USD' check (moneda_venta in ('USD', 'ARS')),
  vendedor_id uuid references public.perfiles(id),
  fecha_cierre date not null default current_date,
  cliente_id uuid references public.clientes(id),
  comprador_nombre text not null,
  comprador_telefono text,
  comprador_email text,
  comprador_dni text,
  propietario_nombre text,
  propietario_telefono text,
  metodo_pago text check (metodo_pago in ('Contado', 'Financiado', 'Leasing', 'Permuta', 'Criptomonedas')),
  cuotas_plazo int,
  monto_financiacion numeric,
  responsable_consignacion_id uuid references public.perfiles(id),
  gestor_asignado_id uuid references public.perfiles(id),
  comision_manual boolean not null default false,
  comision_vendedor_pct numeric not null default 1,
  comision_consignacion_pct numeric not null default 0.5,
  vendedor_compartido boolean not null default false,
  vendedor_compartido_id uuid references public.perfiles(id),
  vendedor_compartido_pct numeric,
  extra_cobrado_monto numeric,
  extra_cobrado_moneda text default 'USD',
  entrega_tuerca_seguridad boolean not null default false,
  entrega_duplicado_llave boolean not null default false,
  entrega_manuales boolean not null default false,
  entrega_cedula boolean not null default false,
  fecha_entrega date,
  notas text,
  comentario_gestoria text,
  comentario_finanzas text,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ventas_estado_idx on public.ventas(estado);
create index if not exists ventas_vendedor_idx on public.ventas(vendedor_id);
create index if not exists ventas_created_idx on public.ventas(created_at);

alter table public.ventas enable row level security;

drop policy if exists "ver_ventas" on public.ventas;
create policy "ver_ventas" on public.ventas for select to authenticated using (true);

drop policy if exists "crear_ventas" on public.ventas;
create policy "crear_ventas" on public.ventas for insert to authenticated with check (true);

drop policy if exists "editar_ventas" on public.ventas;
create policy "editar_ventas" on public.ventas for update to authenticated using (true) with check (true);

drop policy if exists "borrar_ventas" on public.ventas;
create policy "borrar_ventas" on public.ventas for delete to authenticated
  using (exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles)));

-- Señas/adelantos — lista repetible por venta. "pendiente" hasta que
-- Tesorería (todavía no construida) las confirme en Finanzas → Señas.
create table if not exists public.venta_senas (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  monto numeric not null,
  moneda text not null default 'USD' check (moneda in ('USD', 'ARS')),
  fecha date not null default current_date,
  caja_destino text,
  comprobante_url text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmada')),
  created_at timestamptz not null default now()
);

alter table public.venta_senas enable row level security;
drop policy if exists "ver_venta_senas" on public.venta_senas;
create policy "ver_venta_senas" on public.venta_senas for select to authenticated using (true);
drop policy if exists "crear_venta_senas" on public.venta_senas;
create policy "crear_venta_senas" on public.venta_senas for insert to authenticated with check (true);
drop policy if exists "borrar_venta_senas" on public.venta_senas;
create policy "borrar_venta_senas" on public.venta_senas for delete to authenticated using (true);

-- Permutas — uno o más vehículos que el comprador entrega como parte de
-- pago. "cargar_a_stock" crea la fila en vehiculos y queda linkeada acá.
create table if not exists public.venta_permutas (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  valor numeric,
  moneda text default 'USD' check (moneda in ('USD', 'ARS')),
  precio_publicacion numeric,
  marca text,
  modelo text,
  anio int,
  km numeric,
  patente text,
  color text,
  condicion text default 'Muy bueno',
  cargar_a_stock boolean not null default false,
  dueno_nombre text,
  vehiculo_creado_id uuid references public.vehiculos(id),
  created_at timestamptz not null default now()
);

alter table public.venta_permutas enable row level security;
drop policy if exists "ver_venta_permutas" on public.venta_permutas;
create policy "ver_venta_permutas" on public.venta_permutas for select to authenticated using (true);
drop policy if exists "crear_venta_permutas" on public.venta_permutas;
create policy "crear_venta_permutas" on public.venta_permutas for insert to authenticated with check (true);

-- Cuotas de financiación — se generan solas al crear una venta Financiado
-- con plazo de cuotas. Finanzas → Cuotas (no construido) las va a gestionar.
create table if not exists public.venta_cuotas (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  numero int not null,
  monto numeric not null,
  moneda text not null default 'USD',
  vencimiento date not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagada')),
  created_at timestamptz not null default now()
);

create index if not exists venta_cuotas_venta_idx on public.venta_cuotas(venta_id, numero);

alter table public.venta_cuotas enable row level security;
drop policy if exists "ver_venta_cuotas" on public.venta_cuotas;
create policy "ver_venta_cuotas" on public.venta_cuotas for select to authenticated using (true);
drop policy if exists "crear_venta_cuotas" on public.venta_cuotas;
create policy "crear_venta_cuotas" on public.venta_cuotas for insert to authenticated with check (true);

-- Expediente — hoy es solo el registro de "esta venta necesita trámite".
-- Gestoría (no construida) va a leer de acá cuando exista.
create table if not exists public.expedientes (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null unique references public.ventas(id) on delete cascade,
  tipo text not null default 'venta',
  estado text not null default 'abierto' check (estado in ('abierto', 'en_tramite', 'cerrado')),
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

alter table public.expedientes enable row level security;
drop policy if exists "ver_expedientes" on public.expedientes;
create policy "ver_expedientes" on public.expedientes for select to authenticated using (true);
drop policy if exists "crear_expedientes" on public.expedientes;
create policy "crear_expedientes" on public.expedientes for insert to authenticated with check (true);
