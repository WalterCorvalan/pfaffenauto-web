-- Panel v2 — Réplica completa de Señas/Presupuestos de v1 + Tesorería
-- mínima (necesaria porque el "cobro en Tesorería" de la seña de v1 escribe
-- en movimientos_caja/cuentas, que nova no tenía). 100% aditivo:
-- - senas/presupuestos YA EXISTÍAN (versión simple, usada por Stock) — se
--   amplían con columnas nuevas nullable, nada existente se toca ni se
--   renombra. cliente_nombre/monto/moneda/notas (simples) siguen
--   funcionando igual para el modal rápido de Stock.
-- - cuentas/movimientos_caja son tablas nuevas, mismo esquema que v1.

-- ============================================================
-- 1) Tesorería mínima
-- ============================================================
create table if not exists public.cuentas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null default 'Banco' check (tipo in ('Banco', 'Tarjeta', 'Efectivo', 'Otro')),
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  saldo_inicial numeric not null default 0,
  sucursal_id uuid references public.sucursales(id),
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.cuentas enable row level security;
drop policy if exists "equipo_cuentas" on public.cuentas;
create policy "equipo_cuentas" on public.cuentas for all to authenticated using (true) with check (true);

create table if not exists public.movimientos_caja (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  monto numeric not null,
  forma_pago text,
  fecha date not null default current_date,
  vehiculo_id uuid references public.vehiculos(id) on delete set null,
  sucursal_id uuid references public.sucursales(id),
  cuenta_id uuid references public.cuentas(id),
  cliente_id uuid references public.clientes(id),
  cuit_dni text,
  telefono text,
  patente text,
  vendedor_id uuid references public.perfiles(id),
  sena_id uuid references public.senas(id) on delete set null,
  tipo_movimiento text,
  comprobante_url text,
  observaciones text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado')),
  created_at timestamptz not null default now()
);

create index if not exists movimientos_caja_cuenta_idx on public.movimientos_caja(cuenta_id);
create index if not exists movimientos_caja_sena_idx on public.movimientos_caja(sena_id);

alter table public.movimientos_caja enable row level security;
drop policy if exists "equipo_movimientos_caja" on public.movimientos_caja;
create policy "equipo_movimientos_caja" on public.movimientos_caja for all to authenticated using (true) with check (true);

-- ============================================================
-- 2) Señas — se amplía la tabla simple existente al esquema completo de v1
-- ============================================================
alter table public.senas
  add column if not exists numero int,
  add column if not exists codigo_seguimiento text unique,
  add column if not exists etapa_seguimiento text default 'Seña',
  add column if not exists fecha date default current_date,
  add column if not exists sucursal_id uuid references public.sucursales(id),
  add column if not exists cliente_id uuid references public.clientes(id),
  add column if not exists dni text,
  add column if not exists fecha_nacimiento date,
  add column if not exists apellido text,
  add column if not exists nombre text,
  add column if not exists calle text,
  add column if not exists numero_calle text,
  add column if not exists depto text,
  add column if not exists localidad text,
  add column if not exists codigo_postal text,
  add column if not exists provincia text,
  add column if not exists telefono_linea text,
  add column if not exists telefono_celular text,
  add column if not exists correo_electronico text,
  add column if not exists cuit_cuil text,
  add column if not exists estado_civil text,
  add column if not exists profesion text,
  add column if not exists dominio text,
  add column if not exists segmento text,
  add column if not exists marca text,
  add column if not exists modelo text,
  add column if not exists tipo text,
  add column if not exists marca_motor text,
  add column if not exists numero_motor text,
  add column if not exists marca_chasis text,
  add column if not exists numero_chasis text,
  add column if not exists modelo_anio int,
  add column if not exists color text,
  add column if not exists cuenta_orden_apellido_nombre text,
  add column if not exists cuenta_orden_dni text,
  add column if not exists cuenta_orden_direccion text,
  add column if not exists venta_ars numeric,
  add column if not exists venta_usd numeric,
  add column if not exists sena_ars numeric,
  add column if not exists sena_usd numeric,
  add column if not exists tipo_cambio numeric,
  add column if not exists patentamiento_transferencia_ars numeric,
  add column if not exists banco_prenda text,
  add column if not exists prenda_monto numeric,
  add column if not exists cant_cuotas_prenda int,
  add column if not exists cuota_prenda_ars numeric,
  add column if not exists seguro_prenda_ars numeric,
  add column if not exists saldo_abonar_ars numeric,
  add column if not exists seguro_compania text,
  add column if not exists seguro_importe_mensual numeric,
  add column if not exists precio_confirmado boolean,
  add column if not exists efectivo_ars numeric,
  add column if not exists efectivo_usd numeric,
  add column if not exists permuta_vehiculo_id uuid references public.vehiculos(id),
  add column if not exists permuta_tasado_ars numeric,
  add column if not exists remanente_ars numeric,
  add column if not exists fecha_primera_cuota_remanente date,
  add column if not exists cant_cuotas_remanente int,
  add column if not exists cuota_remanente_ars numeric,
  add column if not exists cuenta_id uuid references public.cuentas(id),
  add column if not exists comprobante_url text;

-- ============================================================
-- 3) Presupuestos — misma idea, se amplía la tabla simple existente
-- ============================================================
alter table public.presupuestos
  add column if not exists numero int,
  add column if not exists fecha date default current_date,
  add column if not exists token_publico text unique,
  add column if not exists cliente_id uuid references public.clientes(id),
  add column if not exists dominio text,
  add column if not exists segmento text,
  add column if not exists marca text,
  add column if not exists modelo text,
  add column if not exists tipo text,
  add column if not exists modelo_anio int,
  add column if not exists color text,
  add column if not exists kilometros numeric,
  add column if not exists combustible text,
  add column if not exists imprimir_en text,
  add column if not exists precio_confirmado boolean;
