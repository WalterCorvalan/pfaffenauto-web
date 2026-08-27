-- Panel v2 — Stock (vehículos, mandatos, peritajes, catálogo público).
-- Corre en la base NUEVA (vdcpmbajlyqgohrwpkeo).
-- El catálogo público (/catalogo-v2) pega contra esta base SIN sesión de
-- usuario (rol "anon" de Supabase) — por eso vehiculos tiene una policy de
-- select aparte para anon (solo "disponible") y los contadores de visitas
-- se escriben por una función security definer, no por UPDATE directo.

create table if not exists public.vehiculos (
  id uuid primary key default gen_random_uuid(),
  categoria text not null default 'Auto' check (categoria in ('Auto', 'Camioneta', 'SUV', 'Moto', 'Otro')),
  marca text not null,
  modelo text not null,
  anio int not null,
  patente text,
  color text,
  condicion text not null default 'Muy bueno' check (condicion in ('0km', 'Excelente', 'Muy bueno', 'Bueno', 'Regular')),
  km numeric,
  precio_venta numeric not null,
  moneda_venta text not null default 'USD' check (moneda_venta in ('USD', 'ARS')),
  precio_compra numeric,
  moneda_compra text default 'USD' check (moneda_compra in ('USD', 'ARS')),
  tc_ingreso numeric,
  ubicacion text not null default 'Salón Principal',
  estado text not null default 'disponible' check (estado in ('disponible', 'reservado', 'señado', 'vendido', 'en_preparacion')),
  propio_agencia boolean not null default false,
  propietario_nombre text,
  propietario_dni text,
  propietario_telefono text,
  propietario_email text,
  cliente_vinculado_id uuid references public.clientes(id),
  consignado_por uuid references public.perfiles(id),
  combustible text,
  transmision text,
  carroceria text,
  puertas int,
  motor_cilindrada text,
  version text,
  manuales boolean not null default false,
  duplicado_llaves boolean not null default false,
  servicios_oficiales boolean not null default false,
  publicado_ml boolean not null default false,
  publicado_por text,
  link_ml text,
  notas text,
  fotos text[] not null default '{}',
  dueños_anteriores int default 1,
  mandato_id uuid,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehiculos_estado_idx on public.vehiculos(estado);
create index if not exists vehiculos_consignado_idx on public.vehiculos(consignado_por);
create index if not exists vehiculos_created_idx on public.vehiculos(created_at);

alter table public.vehiculos enable row level security;

drop policy if exists "ver_vehiculos_equipo" on public.vehiculos;
create policy "ver_vehiculos_equipo" on public.vehiculos for select to authenticated using (true);

drop policy if exists "ver_vehiculos_publico" on public.vehiculos;
create policy "ver_vehiculos_publico" on public.vehiculos for select to anon using (estado = 'disponible');

drop policy if exists "crear_vehiculos" on public.vehiculos;
create policy "crear_vehiculos" on public.vehiculos for insert to authenticated with check (true);

drop policy if exists "editar_vehiculos" on public.vehiculos;
create policy "editar_vehiculos" on public.vehiculos for update to authenticated using (true) with check (true);

drop policy if exists "borrar_vehiculos" on public.vehiculos;
create policy "borrar_vehiculos" on public.vehiculos for delete to authenticated
  using (exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles)));

-- Mandatos: registro legal del mandante (dueño) + snapshot del vehículo,
-- separado de la ficha de stock. "Agregar al stock" desde el modal crea
-- también la fila en vehiculos y la linkea acá.
create table if not exists public.mandatos (
  id uuid primary key default gen_random_uuid(),
  mandante_nombre text not null,
  mandante_dni_cuit text,
  mandante_domicilio text not null,
  mandante_telefono text,
  mandante_email text,
  vehiculo_marca text not null,
  vehiculo_modelo text not null,
  vehiculo_anio int not null,
  vehiculo_color text,
  vehiculo_patente text,
  vehiculo_km numeric,
  fecha date not null default current_date,
  plazo_dias int not null default 60,
  tipo_tramite text not null default 'Venta' check (tipo_tramite in ('Venta', 'Consignación', 'Permuta', 'Otro')),
  mandatario text not null,
  seccional_registro text,
  tipo_carroceria text,
  motor_nro text,
  chasis_nro text,
  dueños_anteriores int default 1,
  servicios_oficiales boolean,
  manuales boolean,
  duplicado_llaves boolean,
  auxilio text default 'No trae' check (auxilio in ('Trae', 'No trae')),
  valor numeric,
  moneda text not null default 'USD' check (moneda in ('USD', 'ARS')),
  vehiculo_id uuid references public.vehiculos(id),
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

alter table public.mandatos enable row level security;

drop policy if exists "ver_mandatos" on public.mandatos;
create policy "ver_mandatos" on public.mandatos for select to authenticated using (true);

drop policy if exists "crear_mandatos" on public.mandatos;
create policy "crear_mandatos" on public.mandatos for insert to authenticated with check (true);

drop policy if exists "editar_mandatos" on public.mandatos;
create policy "editar_mandatos" on public.mandatos for update to authenticated using (true) with check (true);

alter table public.vehiculos
  add constraint vehiculos_mandato_fk foreign key (mandato_id) references public.mandatos(id);

-- Peritaje: checklist de inspección, con historial (un vehículo puede
-- peritarse más de una vez). El listado de Stock muestra el más reciente.
create table if not exists public.peritajes (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid not null references public.vehiculos(id) on delete cascade,
  mecanica text check (mecanica in ('ok', 'observacion', 'revisar')),
  tren_delantero text check (tren_delantero in ('ok', 'observacion', 'revisar')),
  frenos text check (frenos in ('ok', 'observacion', 'revisar')),
  chapa_pintura text check (chapa_pintura in ('ok', 'observacion', 'revisar')),
  interior text check (interior in ('ok', 'observacion', 'revisar')),
  gomas text,
  service text,
  llaves text,
  unico_dueno boolean,
  km_verificado boolean,
  doc_titulo boolean,
  doc_vtv boolean,
  doc_libre_deuda boolean,
  doc_transferible boolean,
  notas text,
  firmado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists peritajes_vehiculo_idx on public.peritajes(vehiculo_id, created_at desc);

alter table public.peritajes enable row level security;

drop policy if exists "ver_peritajes" on public.peritajes;
create policy "ver_peritajes" on public.peritajes for select to authenticated using (true);

drop policy if exists "ver_peritajes_publico" on public.peritajes;
create policy "ver_peritajes_publico" on public.peritajes for select to anon using (true);

drop policy if exists "crear_peritajes" on public.peritajes;
create policy "crear_peritajes" on public.peritajes for insert to authenticated with check (true);

-- Catálogo público: fila única de configuración + contadores.
create table if not exists public.catalogo_config (
  id text primary key default 'default',
  mostrar_precios boolean not null default true,
  visitas_totales int not null default 0,
  fichas_vistas_totales int not null default 0,
  consultas_whatsapp_totales int not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.catalogo_config (id) values ('default') on conflict (id) do nothing;

alter table public.catalogo_config enable row level security;

drop policy if exists "ver_catalogo_config" on public.catalogo_config;
create policy "ver_catalogo_config" on public.catalogo_config for select to authenticated, anon using (true);

drop policy if exists "editar_catalogo_config" on public.catalogo_config;
create policy "editar_catalogo_config" on public.catalogo_config for update to authenticated using (true) with check (true);

-- Incrementa un contador del catálogo público sin darle a "anon" un UPDATE
-- abierto sobre la tabla (esta función corre con los permisos del dueño).
create or replace function public.incrementar_stat_catalogo(campo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if campo = 'visitas' then
    update public.catalogo_config set visitas_totales = visitas_totales + 1, updated_at = now() where id = 'default';
  elsif campo = 'ficha' then
    update public.catalogo_config set fichas_vistas_totales = fichas_vistas_totales + 1, updated_at = now() where id = 'default';
  elsif campo = 'whatsapp' then
    update public.catalogo_config set consultas_whatsapp_totales = consultas_whatsapp_totales + 1, updated_at = now() where id = 'default';
  end if;
end;
$$;

grant execute on function public.incrementar_stat_catalogo(text) to anon, authenticated;
