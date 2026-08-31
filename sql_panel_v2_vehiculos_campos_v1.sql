-- Panel v2 — Suma a public.vehiculos los campos que tenía v1 y le faltaban
-- a nova. 100% aditivo: ningún campo existente se toca ni se renombra, todo
-- columnas nuevas opcionales. Agrupado igual que el pedido: técnicos,
-- gestión comercial, precios (mínimo, sin tocar lo que ya alimenta
-- dashboard/reportes), y datos del proveedor/dueño anterior.

-- ============================================================
-- 1) Datos técnicos
-- ============================================================
alter table public.vehiculos
  add column if not exists segmento text,
  add column if not exists traccion text,
  add column if not exists potencia_cv numeric,
  add column if not exists cantidad_plazas int,
  add column if not exists origen text check (origen is null or origen in ('Nacional', 'Importado')),
  add column if not exists numero_motor text,
  add column if not exists marca_motor text,
  add column if not exists numero_chasis text,
  add column if not exists marca_chasis text,
  add column if not exists radicado_localidad text,
  add column if not exists radicado_provincia text;

-- ============================================================
-- 2) Gestión comercial
-- ============================================================
alter table public.vehiculos
  add column if not exists stock_fisico boolean not null default true,
  add column if not exists destacado boolean not null default false,
  add column if not exists fecha_compra date,
  add column if not exists importe_patente_anual numeric;

-- Sucursal: v1 la maneja como tabla relacional (sucursal_id), nova hoy solo
-- tiene "ubicacion" como texto libre — se deja "ubicacion" intacta (nadie
-- la toca) y se suma la relación aparte. Se siembra una sucursal con el
-- mismo nombre que ya usa el default de "ubicacion" para no dejar el dato
-- huérfano.
create table if not exists public.sucursales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  created_at timestamptz not null default now()
);

insert into public.sucursales (nombre) values ('Salón Principal') on conflict (nombre) do nothing;

alter table public.sucursales enable row level security;
drop policy if exists "equipo_sucursales" on public.sucursales;
create policy "equipo_sucursales" on public.sucursales for all to authenticated using (true) with check (true);

alter table public.vehiculos
  add column if not exists sucursal_id uuid references public.sucursales(id),
  add column if not exists sucursal_compra_id uuid references public.sucursales(id);

-- ============================================================
-- 3) Precios — mínimo posible: solo lo que faltaba (precio_publicado_usd,
-- espejo del precio_publicado_ars que ya sumó Marketing). NO se toca
-- precio_compra/moneda_compra/precio_venta/moneda_venta ni se agrega un
-- "precio_costo_usd" separado — esos ya alimentan dashboard/reportes con
-- el esquema de "un monto + un selector de moneda", y duplicarlo en dos
-- columnas por moneda rompería esa lógica en otros lados sin avisar antes.
-- ============================================================
alter table public.vehiculos
  add column if not exists precio_publicado_usd numeric;

-- ============================================================
-- 4) Datos del proveedor / dueño anterior
-- ============================================================
alter table public.vehiculos
  add column if not exists propietario_apellido text,
  add column if not exists propietario_fecha_nacimiento date,
  add column if not exists propietario_cuit_cuil text,
  add column if not exists propietario_calle text,
  add column if not exists propietario_numero text,
  add column if not exists propietario_depto text,
  add column if not exists propietario_localidad text,
  add column if not exists propietario_codigo_postal text,
  add column if not exists propietario_provincia text,
  add column if not exists propietario_telefono_celular text;
-- propietario_nombre y propietario_telefono existentes quedan igual — no se
-- dividen ni se renombran, así el código/datos actuales no se rompen.
