-- Auditoría de flujo de dinero (2026-09-08): 3 módulos actualizaban su
-- propia tabla pero nunca tocaban movimientos_caja, así que esa plata no
-- aparecía en saldo de cuenta / Libro Mayor / Libros Contables. Se conectan
-- acá reusando registrar_movimiento_caja() (ya validado, no se toca su
-- firma), con el mismo patrón reversible que ya usa registrar_pago_comprador_venta
-- (revertir el movimiento viejo antes de recrear uno nuevo, para poder
-- corregir sin duplicar).

-- ============================================================
-- 1) CHEQUES -- no tenía ninguna conexión a movimientos_caja.
-- ============================================================
alter table public.cheques add column if not exists cuenta_id uuid references public.cuentas(id);
alter table public.cheques add column if not exists movimiento_id uuid references public.movimientos_caja(id);

create or replace function public.cambiar_estado_cheque(p_cheque_id uuid, p_estado text, p_cuenta_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cheque record;
  v_mov_id uuid;
begin
  select * into v_cheque from public.cheques where id = p_cheque_id;
  if v_cheque is null then
    raise exception 'Cheque no encontrado.';
  end if;

  -- Si estaba "cobrado" y se lo saca de ahí (ej: rebotó después de
  -- acreditado), revertimos el movimiento anterior antes de aplicar el
  -- nuevo estado -- así nunca queda un ingreso/egreso fantasma en caja.
  if v_cheque.estado = 'cobrado' and p_estado <> 'cobrado' and v_cheque.movimiento_id is not null then
    update public.movimientos_caja set deleted_at = now() where id = v_cheque.movimiento_id;
  end if;

  if p_estado = 'cobrado' and v_cheque.estado <> 'cobrado' then
    if p_cuenta_id is null then
      raise exception 'Elegí a qué cuenta/caja entra (si es "a cobrar") o sale (si es "emitido") el cheque.';
    end if;
    select public.registrar_movimiento_caja(
      p_tipo => case when v_cheque.tipo = 'a_cobrar' then 'ingreso' else 'egreso' end,
      p_monto => v_cheque.monto,
      p_cuenta_id => p_cuenta_id,
      p_fecha => coalesce(v_cheque.fecha_cobro, current_date),
      p_categoria => 'Cheque',
      p_observaciones => 'Cheque ' || coalesce(v_cheque.numero, 's/n') || ' — ' || v_cheque.librador
    ) into v_mov_id;
    update public.cheques set estado = p_estado, cuenta_id = p_cuenta_id, movimiento_id = v_mov_id where id = p_cheque_id;
  else
    update public.cheques set estado = p_estado, movimiento_id = (case when p_estado = 'cobrado' then movimiento_id else null end) where id = p_cheque_id;
  end if;
end;
$$;

-- ============================================================
-- 2) COMISIONES -- marcar_comision_cobrada (el botón de 1 click) solo
-- actualizaba la tabla comisiones, nunca creaba el egreso. El flujo de
-- pago parcial (registrar_pago_parcial_comision) ya está bien conectado,
-- no se toca.
-- ============================================================
alter table public.comisiones add column if not exists movimiento_id uuid references public.movimientos_caja(id);

create or replace function public.marcar_comision_cobrada(p_comision_id uuid, p_forzar_sin_resena boolean default false, p_cuenta_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comision record;
  v_tipo_resena text;
  v_tiene_resena boolean;
  v_exige boolean;
  v_soy_admin boolean;
  v_mov_id uuid;
begin
  select * into v_comision from public.comisiones where id = p_comision_id;
  if v_comision is null then
    raise exception 'Comisión no encontrada.';
  end if;

  select exists(select 1 from public.perfiles where id = auth.uid() and ('admin' = any(roles) or 'finanzas' = any(roles))) into v_soy_admin;

  if not v_soy_admin and auth.uid() <> v_comision.beneficiario_id then
    raise exception 'No tenés permiso para marcar cobrada esta comisión.';
  end if;

  select exigir_resena_comision into v_exige from public.configuracion_empresa where id = true;

  if v_exige and v_comision.venta_id is not null and v_comision.tipo in ('vendedor', 'vendedor_compartido', 'consignacion') then
    v_tipo_resena := case when v_comision.tipo = 'consignacion' then 'ex_dueno' else 'comprador' end;
    select exists(select 1 from public.venta_resenas_solicitudes where venta_id = v_comision.venta_id and tipo = v_tipo_resena) into v_tiene_resena;

    if not v_tiene_resena then
      if p_forzar_sin_resena and v_soy_admin then
        update public.comisiones set aprobado_sin_resena_por = auth.uid(), aprobado_sin_resena_en = now() where id = p_comision_id;
      else
        raise exception 'Pedí la reseña antes de cobrar (o forzá el pago como admin/finanzas).';
      end if;
    end if;
  end if;

  -- El resto que falte de la comisión (monto - lo ya pagado por pagos
  -- parciales) es lo que se egresa acá -- si ya se venía pagando en
  -- partes, "marcar cobrada" solo liquida el saldo, no el monto entero.
  declare
    v_restante numeric := v_comision.monto - coalesce(v_comision.monto_pagado, 0);
  begin
    if v_restante > 0 then
      if p_cuenta_id is null then
        raise exception 'Elegí de qué caja/cuenta sale el pago de la comisión.';
      end if;
      select public.registrar_movimiento_caja(
        p_tipo => 'egreso',
        p_monto => v_restante,
        p_cuenta_id => p_cuenta_id,
        p_fecha => current_date,
        p_categoria => 'Comisión',
        p_observaciones => 'Comisión ' || v_comision.tipo || ' — ' || coalesce(v_comision.concepto, '')
      ) into v_mov_id;
    end if;
  end;

  update public.comisiones
  set estado = 'cobrada', monto_pagado = monto, fecha_cobro = coalesce(fecha_cobro, current_date), aprobacion_pendiente = false, updated_at = now(),
      movimiento_id = coalesce(v_mov_id, movimiento_id)
  where id = p_comision_id;
end;
$$;

-- Volver una comisión ya cobrada a pendiente (solo admin/finanzas) revierte
-- también el egreso que se había generado -- antes esto no existía
-- versionado; se agrega con el mismo criterio reversible.
create or replace function public.cambiar_estado_comision(p_comision_id uuid, p_nuevo_estado text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comision record;
  v_soy_admin boolean;
begin
  select * into v_comision from public.comisiones where id = p_comision_id;
  if v_comision is null then
    raise exception 'Comisión no encontrada.';
  end if;

  select exists(select 1 from public.perfiles where id = auth.uid() and ('admin' = any(roles) or 'finanzas' = any(roles))) into v_soy_admin;
  if not v_soy_admin then
    raise exception 'Solo administración puede volver una comisión a pendiente.';
  end if;

  if v_comision.movimiento_id is not null then
    update public.movimientos_caja set deleted_at = now() where id = v_comision.movimiento_id;
  end if;

  update public.comisiones
  set estado = p_nuevo_estado, monto_pagado = 0, movimiento_id = null, updated_at = now()
  where id = p_comision_id;
end;
$$;

-- ============================================================
-- 3) VENTA_CUOTAS -- el cronograma de cuotas de una venta financiada se
-- creaba al armar la venta, pero no existía ninguna forma de marcar una
-- cuota como cobrada (ni RPC ni UI) -- quedaban invisibles para siempre.
-- ============================================================
alter table public.venta_cuotas add column if not exists movimiento_id uuid references public.movimientos_caja(id);
alter table public.venta_cuotas add column if not exists fecha_pago date;

create or replace function public.cobrar_venta_cuota(p_cuota_id uuid, p_cuenta_id uuid, p_fecha date default current_date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cuota record;
  v_venta record;
  v_mov_id uuid;
begin
  select * into v_cuota from public.venta_cuotas where id = p_cuota_id;
  if v_cuota is null then
    raise exception 'Cuota no encontrada.';
  end if;
  if v_cuota.estado = 'pagada' then
    raise exception 'Esta cuota ya está cobrada.';
  end if;

  select * into v_venta from public.ventas where id = v_cuota.venta_id;

  select public.registrar_movimiento_caja(
    p_tipo => 'ingreso',
    p_monto => v_cuota.monto,
    p_cuenta_id => p_cuenta_id,
    p_fecha => p_fecha,
    p_categoria => 'Cobro de cuota',
    p_venta_id => v_cuota.venta_id,
    p_observaciones => 'Cuota N° ' || v_cuota.numero || ' — ' || coalesce(v_venta.vehiculo_marca, '') || ' ' || coalesce(v_venta.vehiculo_modelo, '')
  ) into v_mov_id;

  update public.venta_cuotas set estado = 'pagada', fecha_pago = p_fecha, movimiento_id = v_mov_id where id = p_cuota_id;

  return v_mov_id;
end;
$$;
