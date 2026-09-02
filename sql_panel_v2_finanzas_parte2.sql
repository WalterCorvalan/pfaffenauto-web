-- Panel v2 — Finanzas parte 2: Devol. Registro, Pagos Disp., Tarjeta,
-- Retiros, Cuentas (reset/editar), Cheques. Rentabilidad NO necesita tablas
-- nuevas: agrupa movimientos_caja por tipo_movimiento (columna ya existente,
-- alimentada por el mismo "Registrar" genérico de Movimientos) filtrando los
-- que no tienen venta_id (esos son ganancia de venta, van en Reportes).
--
-- Mismo mandato que la parte 1: cero tolerancia a errores de centavos,
-- separación estricta ARS/USD, ninguna mutación de plata por INSERT/UPDATE
-- suelto — todo pasa por función security definer.

-- ============================================================
-- 1) Cuentas — campos que faltaban para el modal completo + reset de saldo
-- inicial (mantenimiento, no mueve movimientos).
-- ============================================================
alter table public.cuentas
  add column if not exists entidad text,
  add column if not exists numero_cuenta text,
  add column if not exists notas text;

create or replace function public.resetear_saldo_cuenta(p_cuenta_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists(select 1 from public.perfiles where id = auth.uid() and 'admin' = any(roles)) then
    raise exception 'Solo un admin puede resetear el saldo de una cuenta.';
  end if;
  update public.cuentas set saldo_inicial = 0 where id = p_cuenta_id;
end;
$$;

-- ============================================================
-- 2) Cheques — control de vencimientos/importes, no mueve saldo de caja.
-- ============================================================
create table if not exists public.cheques (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('a_cobrar', 'emitido')),
  formato text not null default 'fisico' check (formato in ('fisico', 'echeque')),
  librador text not null,
  numero text,
  banco text,
  cuit_cuil text,
  monto numeric not null,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'cobrado', 'depositado', 'rechazado', 'endosado')),
  fecha_emision date,
  fecha_cobro date not null,
  caja_banco_propio text,
  notas text,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists cheques_fecha_cobro_idx on public.cheques(fecha_cobro) where estado = 'pendiente';

alter table public.cheques enable row level security;
drop policy if exists "equipo_cheques" on public.cheques;
create policy "equipo_cheques" on public.cheques for all to authenticated using (true) with check (true);

-- ============================================================
-- 3) Pagos disponibles — plata que la agencia debe entregarle a un
-- propietario (consignación) una vez que cobró del cliente. Parcial o
-- total, como cuotas. Al marcarse cobrado genera el EGRESO real.
-- ============================================================
create table if not exists public.pagos_disponibles (
  id uuid primary key default gen_random_uuid(),
  descripcion text not null,
  monto numeric not null,
  monto_cobrado numeric not null default 0,
  moneda text not null default 'USD' check (moneda in ('ARS', 'USD')),
  fecha date not null default current_date,
  cuenta_id uuid references public.cuentas(id),
  expediente_id uuid references public.expedientes(id) on delete set null,
  cliente_propietario text,
  notas text,
  cobrado boolean not null default false,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists pagos_disponibles_fecha_idx on public.pagos_disponibles(fecha) where cobrado = false;

alter table public.pagos_disponibles enable row level security;
drop policy if exists "equipo_pagos_disponibles" on public.pagos_disponibles;
create policy "equipo_pagos_disponibles" on public.pagos_disponibles for all to authenticated using (true) with check (true);

create table if not exists public.pagos_disponibles_cobros (
  id uuid primary key default gen_random_uuid(),
  pago_disponible_id uuid not null references public.pagos_disponibles(id) on delete cascade,
  movimiento_id uuid not null references public.movimientos_caja(id) on delete cascade,
  monto numeric not null,
  registrado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

alter table public.pagos_disponibles_cobros enable row level security;
drop policy if exists "equipo_pagos_disponibles_cobros" on public.pagos_disponibles_cobros;
create policy "equipo_pagos_disponibles_cobros" on public.pagos_disponibles_cobros for all to authenticated using (true) with check (true);

create or replace function public.recalcular_pago_disponible(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric;
  v_monto numeric;
begin
  select coalesce(sum(pc.monto), 0) into v_total
  from public.pagos_disponibles_cobros pc
  join public.movimientos_caja m on m.id = pc.movimiento_id
  where pc.pago_disponible_id = p_id and m.estado = 'aprobado' and m.deleted_at is null;

  select monto into v_monto from public.pagos_disponibles where id = p_id;
  update public.pagos_disponibles set monto_cobrado = v_total, cobrado = (v_total >= v_monto) where id = p_id;
end;
$$;

create or replace function public.cobrar_pago_disponible(
  p_id uuid, p_monto numeric, p_cuenta_id uuid, p_fecha date default current_date, p_notas text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pago record;
  v_mov_id uuid;
begin
  select * into v_pago from public.pagos_disponibles where id = p_id;
  if v_pago is null then raise exception 'Pago no encontrado.'; end if;
  if p_monto <= 0 then raise exception 'El monto tiene que ser mayor a cero.'; end if;

  v_mov_id := public.registrar_movimiento_caja('egreso', p_monto, p_cuenta_id, p_fecha, 'Pago a propietario', null, null, null, null, coalesce(p_notas, v_pago.descripcion));

  insert into public.pagos_disponibles_cobros (pago_disponible_id, movimiento_id, monto, registrado_por)
  values (p_id, v_mov_id, p_monto, auth.uid());

  perform public.recalcular_pago_disponible(p_id);

  return v_mov_id;
end;
$$;

create or replace function public.quitar_pago_disponible_cobro(p_cobro_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c record;
begin
  select * into v_c from public.pagos_disponibles_cobros where id = p_cobro_id;
  if v_c is null then raise exception 'Cobro no encontrado.'; end if;
  perform public.eliminar_movimiento_caja(v_c.movimiento_id, 'Pago a propietario revertido');
  perform public.recalcular_pago_disponible(v_c.pago_disponible_id);
end;
$$;

-- ============================================================
-- 4) Consumos de tarjeta — mientras Pendiente no toca caja ni Finanzas;
-- al pasar a Pagado debita la caja elegida vía movimiento real.
-- ============================================================
create table if not exists public.consumos_tarjeta (
  id uuid primary key default gen_random_uuid(),
  concepto text not null,
  monto numeric not null,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  fecha date not null default current_date,
  cuotas_totales int not null default 1,
  cuota_actual int not null default 1,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado')),
  cuenta_id uuid references public.cuentas(id),
  movimiento_id uuid references public.movimientos_caja(id) on delete set null,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

alter table public.consumos_tarjeta enable row level security;
drop policy if exists "equipo_consumos_tarjeta" on public.consumos_tarjeta;
create policy "equipo_consumos_tarjeta" on public.consumos_tarjeta for all to authenticated using (true) with check (true);

create or replace function public.crear_consumo_tarjeta(
  p_concepto text, p_monto numeric, p_moneda text, p_fecha date,
  p_cuotas_totales int, p_cuota_actual int, p_estado text, p_cuenta_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_mov_id uuid;
begin
  if p_monto <= 0 then raise exception 'El monto tiene que ser mayor a cero.'; end if;
  if p_estado = 'pagado' and p_cuenta_id is null then raise exception 'Elegí la caja de origen para un consumo pagado.'; end if;

  if p_estado = 'pagado' then
    v_mov_id := public.registrar_movimiento_caja('egreso', p_monto, p_cuenta_id, p_fecha, 'Consumo tarjeta', null, null, null, null, p_concepto);
  end if;

  insert into public.consumos_tarjeta (concepto, monto, moneda, fecha, cuotas_totales, cuota_actual, estado, cuenta_id, movimiento_id, creado_por)
  values (p_concepto, p_monto, p_moneda, p_fecha, p_cuotas_totales, p_cuota_actual, p_estado, p_cuenta_id, v_mov_id, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.marcar_consumo_tarjeta_pagado(p_id uuid, p_cuenta_id uuid, p_fecha date default current_date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c record;
  v_mov_id uuid;
begin
  select * into v_c from public.consumos_tarjeta where id = p_id;
  if v_c is null then raise exception 'Consumo no encontrado.'; end if;
  if v_c.estado = 'pagado' then raise exception 'Ese consumo ya está pagado.'; end if;

  v_mov_id := public.registrar_movimiento_caja('egreso', v_c.monto, p_cuenta_id, p_fecha, 'Consumo tarjeta', null, null, null, null, v_c.concepto);

  update public.consumos_tarjeta set estado = 'pagado', cuenta_id = p_cuenta_id, movimiento_id = v_mov_id where id = p_id;
end;
$$;

create or replace function public.eliminar_consumo_tarjeta(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c record;
begin
  select * into v_c from public.consumos_tarjeta where id = p_id;
  if v_c is null then raise exception 'Consumo no encontrado.'; end if;
  if v_c.movimiento_id is not null then
    perform public.eliminar_movimiento_caja(v_c.movimiento_id, 'Consumo de tarjeta eliminado');
  end if;
  delete from public.consumos_tarjeta where id = p_id;
end;
$$;

-- ============================================================
-- 5b) Extiende el motor de Autorizaciones (rama 'egreso_importante') para
-- que, al aprobar un egreso grande vinculado a un Pago Disponible, también
-- recalcule pagos_disponibles.monto_cobrado/cobrado — antes solo sabía de
-- cuota_pagos y este acumulado se quedaba desincronizado tras la aprobación.
-- ============================================================
create or replace function public.aplicar_autorizacion(p_autorizacion record)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_movimiento_id uuid;
  v_cp record;
  v_pd record;
begin
  case p_autorizacion.tipo
    when 'editar_comision_venta' then
      update public.ventas
      set comision_vendedor_pct = (p_autorizacion.datos_despues->>'comision_vendedor_pct')::numeric,
          comision_consignacion_pct = (p_autorizacion.datos_despues->>'comision_consignacion_pct')::numeric
      where id = p_autorizacion.entidad_id;
    when 'egreso_importante' then
      v_movimiento_id := (p_autorizacion.datos_despues->>'movimiento_id')::uuid;
      update public.movimientos_caja set estado = 'aprobado' where id = v_movimiento_id;

      select * into v_cp from public.cuota_pagos where movimiento_id = v_movimiento_id;
      if v_cp is not null then
        if v_cp.cuota_cobrar_id is not null then
          perform public.recalcular_cuota_cobrar(v_cp.cuota_cobrar_id);
        else
          perform public.recalcular_cuota_pagar(v_cp.cuota_pagar_id);
        end if;
      end if;

      select * into v_pd from public.pagos_disponibles_cobros where movimiento_id = v_movimiento_id;
      if v_pd is not null then
        perform public.recalcular_pago_disponible(v_pd.pago_disponible_id);
      end if;
    else
      raise exception 'Tipo de autorización desconocido: %', p_autorizacion.tipo;
  end case;
end;
$$;

-- ============================================================
-- 5) Retiros de caja — siempre debitan al instante (sin estado pendiente).
-- ============================================================
create table if not exists public.retiros_caja (
  id uuid primary key default gen_random_uuid(),
  persona text not null,
  fecha date not null default current_date,
  monto numeric not null,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  cuenta_id uuid not null references public.cuentas(id),
  motivo text,
  movimiento_id uuid not null references public.movimientos_caja(id),
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

alter table public.retiros_caja enable row level security;
drop policy if exists "equipo_retiros_caja" on public.retiros_caja;
create policy "equipo_retiros_caja" on public.retiros_caja for all to authenticated using (true) with check (true);

create or replace function public.registrar_retiro_caja(
  p_persona text, p_fecha date, p_monto numeric, p_moneda text, p_cuenta_id uuid, p_motivo text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_mov_id uuid;
begin
  v_mov_id := public.registrar_movimiento_caja('egreso', p_monto, p_cuenta_id, p_fecha, 'Retiro', null, null, null, null, coalesce(p_motivo, 'Retiro — ' || p_persona));

  insert into public.retiros_caja (persona, fecha, monto, moneda, cuenta_id, motivo, movimiento_id, creado_por)
  values (p_persona, p_fecha, p_monto, p_moneda, p_cuenta_id, p_motivo, v_mov_id, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.eliminar_retiro_caja(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_r record;
begin
  select * into v_r from public.retiros_caja where id = p_id;
  if v_r is null then raise exception 'Retiro no encontrado.'; end if;
  perform public.eliminar_movimiento_caja(v_r.movimiento_id, 'Retiro eliminado');
  delete from public.retiros_caja where id = p_id;
end;
$$;
