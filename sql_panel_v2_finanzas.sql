-- Panel v2 — Finanzas: Resumen, Movimientos (con transferencias, cierres
-- mensuales, multi-comprobantes y soft-delete), Cuentas (ya existía),
-- Cuotas a cobrar (clientes) y Cuotas a pagar (agencia). Señas reusa la
-- tabla `senas` + `movimientos_caja.sena_id` ya existentes — sin cambios de
-- schema para esa pestaña.
--
-- MANDATO EXPLÍCITO DEL USUARIO: este es el módulo más sensible del CRM,
-- cero tolerancia a errores de centavos y separación estricta ARS/USD. Por
-- eso: (a) el saldo de una cuenta NUNCA se guarda — se calcula siempre en
-- vivo desde movimientos_caja (saldo_inicial + ingresos aprobados - egresos
-- aprobados, excluyendo soft-deleted), (b) toda mutación de plata pasa por
-- una función security definer transaccional (nunca un INSERT/UPDATE suelto
-- desde el cliente para las operaciones compuestas: pago de cuota,
-- transferencia, reversión), (c) ninguna suma agrupa monedas distintas —
-- todo cálculo agrega por (moneda) explícito.

-- ============================================================
-- 1) movimientos_caja — sumar lo que faltaba: venta vinculada, grupo de
-- transferencia, soft-delete con motivo, auditoría de creado_por/updated_at.
-- ============================================================
alter table public.movimientos_caja
  add column if not exists venta_id uuid references public.ventas(id) on delete set null,
  add column if not exists transferencia_grupo_id uuid,
  add column if not exists creado_por uuid references public.perfiles(id),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.perfiles(id),
  add column if not exists motivo_eliminacion text;

create index if not exists movimientos_caja_venta_idx on public.movimientos_caja(venta_id);
create index if not exists movimientos_caja_transferencia_idx on public.movimientos_caja(transferencia_grupo_id);
create index if not exists movimientos_caja_fecha_idx on public.movimientos_caja(fecha) where deleted_at is null;

-- ============================================================
-- 2) Comprobantes múltiples por movimiento (además de comprobante_url
-- heredado de una sola imagen, que queda como quedó).
-- ============================================================
create table if not exists public.movimiento_comprobantes (
  id uuid primary key default gen_random_uuid(),
  movimiento_id uuid not null references public.movimientos_caja(id) on delete cascade,
  url text not null,
  nombre text,
  subido_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists movimiento_comprobantes_mov_idx on public.movimiento_comprobantes(movimiento_id);

alter table public.movimiento_comprobantes enable row level security;
drop policy if exists "equipo_movimiento_comprobantes" on public.movimiento_comprobantes;
create policy "equipo_movimiento_comprobantes" on public.movimiento_comprobantes for all to authenticated using (true) with check (true);

-- ============================================================
-- 3) Cierres mensuales — cada mes cerrado congela sus movimientos (solo
-- admin puede tocar/reabrir).
-- ============================================================
create table if not exists public.cierres_mensuales (
  id uuid primary key default gen_random_uuid(),
  mes date not null unique,
  cerrado_por uuid references public.perfiles(id),
  cerrado_en timestamptz not null default now(),
  reabierto_por uuid references public.perfiles(id),
  reabierto_en timestamptz,
  notas text
);

alter table public.cierres_mensuales enable row level security;
drop policy if exists "equipo_cierres_mensuales" on public.cierres_mensuales;
create policy "equipo_cierres_mensuales" on public.cierres_mensuales for select to authenticated using (true);
-- Insert/reapertura pasan por las funciones de abajo.

-- ============================================================
-- 4) Umbral de autorización para egresos — reusa Autorizaciones (config por
-- moneda, ya que nunca se mezclan).
-- ============================================================
alter table public.configuracion_empresa
  add column if not exists umbral_autorizacion_egreso_usd numeric not null default 500,
  add column if not exists umbral_autorizacion_egreso_ars numeric not null default 500000;

-- ============================================================
-- 5) Cuotas a cobrar de clientes (financiaciones) — separado de
-- espacio_cuotas_cobrar, que es personal del dueño y no toca la caja.
-- ============================================================
create table if not exists public.cuotas_cobrar_clientes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id),
  venta_id uuid references public.ventas(id) on delete set null,
  concepto text not null,
  moneda text not null default 'USD' check (moneda in ('ARS', 'USD')),
  monto numeric not null default 0,
  monto_cobrado numeric not null default 0,
  vencimiento date not null,
  cuota_actual int,
  cuota_total int,
  cobrada boolean not null default false,
  notas text,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists cuotas_cobrar_clientes_cliente_idx on public.cuotas_cobrar_clientes(cliente_id);
create index if not exists cuotas_cobrar_clientes_vencimiento_idx on public.cuotas_cobrar_clientes(vencimiento) where cobrada = false;

alter table public.cuotas_cobrar_clientes enable row level security;
drop policy if exists "equipo_cuotas_cobrar_clientes" on public.cuotas_cobrar_clientes;
create policy "equipo_cuotas_cobrar_clientes" on public.cuotas_cobrar_clientes for all to authenticated using (true) with check (true);

-- ============================================================
-- 6) Cuotas a pagar de la agencia (deudas) — separado de espacio_cuotas_pagar.
-- ============================================================
create table if not exists public.cuotas_pagar_agencia (
  id uuid primary key default gen_random_uuid(),
  acreedor text not null,
  tipo_deuda text not null default 'compra' check (tipo_deuda in ('compra', 'auto_cuotas', 'financiera')),
  concepto text,
  vehiculo_id uuid references public.vehiculos(id) on delete set null,
  moneda text not null default 'USD' check (moneda in ('ARS', 'USD')),
  monto numeric not null default 0,
  monto_pagado numeric not null default 0,
  vencimiento date not null,
  cuota_actual int,
  cuota_total int,
  pagada boolean not null default false,
  notas text,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists cuotas_pagar_agencia_vencimiento_idx on public.cuotas_pagar_agencia(vencimiento) where pagada = false;

alter table public.cuotas_pagar_agencia enable row level security;
drop policy if exists "equipo_cuotas_pagar_agencia" on public.cuotas_pagar_agencia;
create policy "equipo_cuotas_pagar_agencia" on public.cuotas_pagar_agencia for all to authenticated using (true) with check (true);

-- ============================================================
-- 7) Vínculo entre un pago/cobro parcial y el/los movimientos de caja que
-- generó — así "Quitar cobro" sabe exactamente qué revertir sin adivinar.
-- ============================================================
create table if not exists public.cuota_pagos (
  id uuid primary key default gen_random_uuid(),
  cuota_cobrar_id uuid references public.cuotas_cobrar_clientes(id) on delete cascade,
  cuota_pagar_id uuid references public.cuotas_pagar_agencia(id) on delete cascade,
  movimiento_id uuid not null references public.movimientos_caja(id) on delete cascade,
  monto numeric not null,
  registrado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  constraint cuota_pagos_un_solo_origen check (
    (cuota_cobrar_id is not null)::int + (cuota_pagar_id is not null)::int = 1
  )
);

alter table public.cuota_pagos enable row level security;
drop policy if exists "equipo_cuota_pagos" on public.cuota_pagos;
create policy "equipo_cuota_pagos" on public.cuota_pagos for all to authenticated using (true) with check (true);

-- ============================================================
-- 8) Funciones — saldo por cuenta (siempre en vivo, nunca guardado),
-- registrar/eliminar movimiento con gate de mes cerrado + umbral de
-- autorización, transferencias atómicas, y pago/reversión de cuotas.
-- ============================================================

create or replace function public.saldo_cuenta(p_cuenta_id uuid)
returns numeric
language sql
stable
set search_path = public
as $$
  select c.saldo_inicial
    + coalesce(sum(case when m.tipo = 'ingreso' then m.monto else 0 end), 0)
    - coalesce(sum(case when m.tipo = 'egreso' then m.monto else 0 end), 0)
  from public.cuentas c
  left join public.movimientos_caja m
    on m.cuenta_id = c.id and m.deleted_at is null and m.estado = 'aprobado'
  where c.id = p_cuenta_id
  group by c.saldo_inicial;
$$;

create or replace function public.soy_admin_o_finanzas()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists(select 1 from public.perfiles where id = auth.uid() and ('admin' = any(roles) or 'finanzas' = any(roles)));
$$;

create or replace function public.mes_esta_cerrado(p_fecha date)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists(
    select 1 from public.cierres_mensuales
    where mes = date_trunc('month', p_fecha)::date and reabierto_en is null
  );
$$;

-- Registrar un movimiento simple (ingreso/egreso). Si el mes está cerrado y
-- no sos admin, rechaza. Si es un egreso que supera el umbral configurado
-- (en su moneda) y no sos admin/finanzas, queda "pendiente" en vez de
-- "aprobado" — no afecta saldo hasta que lo aprueben.
create or replace function public.registrar_movimiento_caja(
  p_tipo text, p_monto numeric, p_cuenta_id uuid, p_fecha date,
  p_categoria text default null, p_forma_pago text default null,
  p_vehiculo_id uuid default null, p_cliente_id uuid default null, p_venta_id uuid default null,
  p_observaciones text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moneda text;
  v_umbral numeric;
  v_estado text := 'aprobado';
  v_id uuid;
begin
  if p_tipo not in ('ingreso', 'egreso') then
    raise exception 'Tipo de movimiento inválido.';
  end if;
  if p_monto <= 0 then
    raise exception 'El monto tiene que ser mayor a cero.';
  end if;

  if public.mes_esta_cerrado(p_fecha) and not public.soy_admin_o_finanzas() then
    raise exception 'Ese mes ya está cerrado. Pedile a un admin que lo reabra.';
  end if;

  select moneda into v_moneda from public.cuentas where id = p_cuenta_id;
  if v_moneda is null then
    raise exception 'Caja no encontrada.';
  end if;

  if p_tipo = 'egreso' and not public.soy_admin_o_finanzas() then
    v_umbral := (select case when v_moneda = 'USD' then umbral_autorizacion_egreso_usd else umbral_autorizacion_egreso_ars end from public.configuracion_empresa where id = true);
    if p_monto >= coalesce(v_umbral, 999999999) then
      v_estado := 'pendiente';
    end if;
  end if;

  insert into public.movimientos_caja (
    tipo, monto, cuenta_id, fecha, tipo_movimiento, forma_pago,
    vehiculo_id, cliente_id, venta_id, observaciones, estado, creado_por
  ) values (
    p_tipo, p_monto, p_cuenta_id, p_fecha, p_categoria, p_forma_pago,
    p_vehiculo_id, p_cliente_id, p_venta_id, p_observaciones, v_estado, auth.uid()
  ) returning id into v_id;

  if v_estado = 'pendiente' then
    insert into public.autorizaciones (tipo, riesgo, requiere_pin, descripcion, entidad_tabla, entidad_id, datos_despues, solicitado_por)
    values ('egreso_importante', 'alto', true, format('Egreso de %s %s pendiente de aprobación', v_moneda, p_monto), 'movimientos_caja', v_id,
            jsonb_build_object('movimiento_id', v_id), auth.uid());
  end if;

  return v_id;
end;
$$;

-- Soft-delete de un movimiento (reversión). Mes cerrado exige admin.
create or replace function public.eliminar_movimiento_caja(p_movimiento_id uuid, p_motivo text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mov record;
begin
  select * into v_mov from public.movimientos_caja where id = p_movimiento_id;
  if v_mov is null or v_mov.deleted_at is not null then
    raise exception 'Movimiento no encontrado.';
  end if;
  if public.mes_esta_cerrado(v_mov.fecha) and not public.soy_admin_o_finanzas() then
    raise exception 'Ese mes ya está cerrado. Pedile a un admin que lo reabra.';
  end if;
  update public.movimientos_caja set deleted_at = now(), deleted_by = auth.uid(), motivo_eliminacion = p_motivo where id = p_movimiento_id;
end;
$$;

-- Transferencia atómica entre dos cajas propias. Misma moneda: entra
-- exactamente lo que sale. Monedas distintas: se cargan los dos montos
-- (el tipo de cambio implícito lo calcula el frontend, no se guarda).
create or replace function public.crear_transferencia(
  p_cuenta_origen_id uuid, p_cuenta_destino_id uuid,
  p_monto_origen numeric, p_monto_destino numeric, p_fecha date, p_notas text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grupo uuid := gen_random_uuid();
  v_moneda_origen text;
  v_moneda_destino text;
begin
  if p_cuenta_origen_id = p_cuenta_destino_id then
    raise exception 'La caja de origen y destino no pueden ser la misma.';
  end if;
  if p_monto_origen <= 0 or p_monto_destino <= 0 then
    raise exception 'Los montos tienen que ser mayores a cero.';
  end if;
  if public.mes_esta_cerrado(p_fecha) and not public.soy_admin_o_finanzas() then
    raise exception 'Ese mes ya está cerrado. Pedile a un admin que lo reabra.';
  end if;

  select moneda into v_moneda_origen from public.cuentas where id = p_cuenta_origen_id;
  select moneda into v_moneda_destino from public.cuentas where id = p_cuenta_destino_id;
  if v_moneda_origen is null or v_moneda_destino is null then
    raise exception 'Caja no encontrada.';
  end if;
  if v_moneda_origen = v_moneda_destino and p_monto_origen <> p_monto_destino then
    raise exception 'Entre cajas de la misma moneda, el monto destino tiene que ser igual al de origen.';
  end if;

  insert into public.movimientos_caja (tipo, monto, cuenta_id, fecha, tipo_movimiento, observaciones, estado, creado_por, transferencia_grupo_id)
  values ('egreso', p_monto_origen, p_cuenta_origen_id, p_fecha, 'Transferencia', p_notas, 'aprobado', auth.uid(), v_grupo);

  insert into public.movimientos_caja (tipo, monto, cuenta_id, fecha, tipo_movimiento, observaciones, estado, creado_por, transferencia_grupo_id)
  values ('ingreso', p_monto_destino, p_cuenta_destino_id, p_fecha, 'Transferencia', p_notas, 'aprobado', auth.uid(), v_grupo);

  return v_grupo;
end;
$$;

-- Cerrar / reabrir mes (admin).
create or replace function public.cerrar_mes(p_mes date, p_notas text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.soy_admin_o_finanzas() then
    raise exception 'Solo Admin o Finanzas pueden cerrar un mes.';
  end if;
  insert into public.cierres_mensuales (mes, cerrado_por, notas)
  values (date_trunc('month', p_mes)::date, auth.uid(), p_notas)
  on conflict (mes) do update set cerrado_por = excluded.cerrado_por, cerrado_en = now(), reabierto_por = null, reabierto_en = null, notas = excluded.notas;
end;
$$;

create or replace function public.reabrir_mes(p_mes date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists(select 1 from public.perfiles where id = auth.uid() and 'admin' = any(roles)) then
    raise exception 'Solo un admin puede reabrir un mes.';
  end if;
  update public.cierres_mensuales set reabierto_por = auth.uid(), reabierto_en = now() where mes = date_trunc('month', p_mes)::date;
end;
$$;

-- Recalculan el acumulado SIEMPRE desde la fuente (suma de cuota_pagos cuyo
-- movimiento está aprobado y no eliminado) — nunca se confía en un
-- incremento a ciegas, así un pago que quedó "pendiente" de autorización no
-- cuenta como cobrado/pagado hasta que se aprueba de verdad.
create or replace function public.recalcular_cuota_cobrar(p_cuota_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric;
  v_monto numeric;
begin
  select coalesce(sum(cp.monto), 0) into v_total
  from public.cuota_pagos cp
  join public.movimientos_caja m on m.id = cp.movimiento_id
  where cp.cuota_cobrar_id = p_cuota_id and m.estado = 'aprobado' and m.deleted_at is null;

  select monto into v_monto from public.cuotas_cobrar_clientes where id = p_cuota_id;
  update public.cuotas_cobrar_clientes set monto_cobrado = v_total, cobrada = (v_total >= v_monto) where id = p_cuota_id;
end;
$$;

create or replace function public.recalcular_cuota_pagar(p_cuota_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric;
  v_monto numeric;
begin
  select coalesce(sum(cp.monto), 0) into v_total
  from public.cuota_pagos cp
  join public.movimientos_caja m on m.id = cp.movimiento_id
  where cp.cuota_pagar_id = p_cuota_id and m.estado = 'aprobado' and m.deleted_at is null;

  select monto into v_monto from public.cuotas_pagar_agencia where id = p_cuota_id;
  update public.cuotas_pagar_agencia set monto_pagado = v_total, pagada = (v_total >= v_monto) where id = p_cuota_id;
end;
$$;

-- Cobrar cuota de cliente (parcial o total). Si el pago queda "pendiente"
-- de autorización (egreso no aplica acá, pero por las dudas se recalcula
-- igual), el acumulado NO se mueve hasta que el movimiento esté aprobado.
create or replace function public.cobrar_cuota_cliente(
  p_cuota_id uuid, p_monto numeric, p_cuenta_id uuid, p_forma_pago text default null, p_fecha date default current_date, p_notas text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cuota record;
  v_mov_id uuid;
begin
  select * into v_cuota from public.cuotas_cobrar_clientes where id = p_cuota_id;
  if v_cuota is null then raise exception 'Cuota no encontrada.'; end if;
  if p_monto <= 0 then raise exception 'El monto tiene que ser mayor a cero.'; end if;

  v_mov_id := public.registrar_movimiento_caja('ingreso', p_monto, p_cuenta_id, p_fecha, 'Cobro de cuota', p_forma_pago, null, v_cuota.cliente_id, v_cuota.venta_id, coalesce(p_notas, v_cuota.concepto));

  insert into public.cuota_pagos (cuota_cobrar_id, movimiento_id, monto, registrado_por)
  values (p_cuota_id, v_mov_id, p_monto, auth.uid());

  perform public.recalcular_cuota_cobrar(p_cuota_id);

  return v_mov_id;
end;
$$;

-- Pagar cuota de la agencia (parcial o total). Espejo de la anterior — acá
-- SÍ puede quedar "pendiente" si supera el umbral de egreso, y el acumulado
-- no se mueve hasta la aprobación.
create or replace function public.pagar_cuota_agencia(
  p_cuota_id uuid, p_monto numeric, p_cuenta_id uuid, p_forma_pago text default null, p_fecha date default current_date, p_notas text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cuota record;
  v_mov_id uuid;
begin
  select * into v_cuota from public.cuotas_pagar_agencia where id = p_cuota_id;
  if v_cuota is null then raise exception 'Cuota no encontrada.'; end if;
  if p_monto <= 0 then raise exception 'El monto tiene que ser mayor a cero.'; end if;

  v_mov_id := public.registrar_movimiento_caja('egreso', p_monto, p_cuenta_id, p_fecha, 'Pago de cuota', p_forma_pago, v_cuota.vehiculo_id, null, null, coalesce(p_notas, v_cuota.concepto));

  insert into public.cuota_pagos (cuota_pagar_id, movimiento_id, monto, registrado_por)
  values (p_cuota_id, v_mov_id, p_monto, auth.uid());

  perform public.recalcular_cuota_pagar(p_cuota_id);

  return v_mov_id;
end;
$$;

-- Quitar un cobro/pago puntual: revierte el movimiento (soft-delete) y
-- recalcula el acumulado desde la fuente.
create or replace function public.quitar_cuota_pago(p_cuota_pago_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cp record;
begin
  select * into v_cp from public.cuota_pagos where id = p_cuota_pago_id;
  if v_cp is null then raise exception 'Pago no encontrado.'; end if;

  perform public.eliminar_movimiento_caja(v_cp.movimiento_id, 'Cobro/pago de cuota revertido');

  if v_cp.cuota_cobrar_id is not null then
    perform public.recalcular_cuota_cobrar(v_cp.cuota_cobrar_id);
  else
    perform public.recalcular_cuota_pagar(v_cp.cuota_pagar_id);
  end if;

  delete from public.cuota_pagos where id = p_cuota_pago_id;
end;
$$;

-- Extiende el motor de Autorizaciones para poder aprobar un egreso
-- importante — y si ese movimiento estaba vinculado a una cuota (cobro o
-- pago), recalcula su acumulado ahora que ya está aprobado.
create or replace function public.aplicar_autorizacion(p_autorizacion record)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_movimiento_id uuid;
  v_cp record;
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
    else
      raise exception 'Tipo de autorización desconocido: %', p_autorizacion.tipo;
  end case;
end;
$$;
