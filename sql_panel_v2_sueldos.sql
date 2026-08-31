-- Panel v2 — Liquidador de sueldos + Categorías de empleados. Replica
-- app/(panel-v1)/panel/sueldos/{categorias,liquidador}. Módulo interno,
-- sin conexión al sitio público.
--
-- Diferencia real con v1: v1 sumaba el "trabajo de taller" contando cambios
-- de estado en historial_cambios (campo etapa_preparacion) — nova no tiene
-- ese registro de auditoría genérico ni ese concepto de etapa de vehículo.
-- cantidad_autos_taller queda como campo manual (lo carga quien liquida) en
-- vez de auto-calculado; el resto (sueldo base, comisiones) sí se arma solo.
--
-- Otra diferencia: v1 asumía todo en pesos. Acá las comisiones reales
-- (tabla comisiones) pueden ser USD o ARS — se separan por moneda en vez de
-- sumarlas juntas, seguridad ya usada en el resto del proyecto para no
-- mezclar monedas.

create table if not exists public.categorias_empleado (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  sueldo_base numeric not null default 0,
  moneda_sueldo text not null default 'ARS' check (moneda_sueldo in ('USD', 'ARS')),
  tiene_comision boolean not null default false,
  monto_por_auto_taller numeric,
  moneda_taller text not null default 'ARS' check (moneda_taller in ('USD', 'ARS')),
  orden int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categorias_empleado enable row level security;
drop policy if exists "equipo_categorias_empleado" on public.categorias_empleado;
create policy "equipo_categorias_empleado" on public.categorias_empleado for all to authenticated using (true) with check (true);

alter table public.perfiles add column if not exists categoria_id uuid references public.categorias_empleado(id);

create table if not exists public.liquidaciones_sueldo (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id),
  mes date not null, -- siempre día 01
  sueldo_base numeric not null default 0,
  moneda_sueldo text not null default 'ARS' check (moneda_sueldo in ('USD', 'ARS')),
  comision_total_usd numeric not null default 0,
  comision_total_ars numeric not null default 0,
  cantidad_autos_taller int not null default 0,
  monto_taller numeric not null default 0,
  moneda_taller text not null default 'ARS' check (moneda_taller in ('USD', 'ARS')),
  faltas int not null default 0,
  tardanzas int not null default 0,
  descuento_presentismo numeric not null default 0,
  total_final numeric not null default 0,
  moneda_total text not null default 'ARS' check (moneda_total in ('USD', 'ARS')),
  observaciones text,
  generado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (perfil_id, mes)
);

create index if not exists liquidaciones_sueldo_perfil_idx on public.liquidaciones_sueldo(perfil_id, mes);

alter table public.liquidaciones_sueldo enable row level security;
drop policy if exists "equipo_liquidaciones_sueldo" on public.liquidaciones_sueldo;
create policy "equipo_liquidaciones_sueldo" on public.liquidaciones_sueldo for all to authenticated using (true) with check (true);

-- Comisiones reales del empleado en el mes, separadas por moneda — el
-- frontend las usa para precargar el formulario del liquidador, sin tener
-- que replicar la lógica de agregación ahí.
create or replace function public.comisiones_periodo_empleado(p_perfil_id uuid, p_desde date, p_hasta date)
returns table (moneda text, total numeric)
language sql
stable
as $$
  select c.moneda, coalesce(sum(c.monto), 0) as total
  from public.comisiones c
  join public.ventas v on v.id = c.venta_id
  where c.beneficiario_id = p_perfil_id
    and v.fecha_cierre >= p_desde and v.fecha_cierre < p_hasta
  group by c.moneda;
$$;
