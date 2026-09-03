-- Fix (auditoría 2026-09-03, "día de trabajo" simulado): confirmar el pago
-- del comprador y marcar pagado al vendedor/propietario en el Expediente
-- solo tocaban columnas de estado en `ventas` — nunca movimientos_caja. La
-- plata real de una venta de contado (el número más grande de todos) podía
-- quedar "pagada" en el CRM sin ningún rastro en Finanzas.
--
-- Reglas acordadas con el dueño:
-- 1) El ingreso del comprador es el saldo real: precio_venta menos las
--    señas ya confirmadas (no se cobra dos veces la seña).
-- 2) Elegir caja es obligatorio antes de registrar cualquier movimiento.
-- 3) La caja elegida tiene que ser de la MISMA moneda que el movimiento —
--    si no, se rechaza (nunca se fuerza un monto de una moneda en una
--    caja de otra).
-- 4) Todo pasa por registrar_movimiento_caja (mismo motor que el resto de
--    Finanzas — respeta umbral/autorización si el monto es grande).
-- 5) Reversible: si se destilda "ya pagó" o se corrige la caja, se
--    revierte el movimiento anterior antes de crear uno nuevo — nunca
--    duplica.

alter table public.ventas
  add column if not exists comprador_pago_movimiento_id uuid references public.movimientos_caja(id),
  add column if not exists pago_vendedor_movimiento_id uuid references public.movimientos_caja(id),
  add column if not exists extra_cobrado_movimiento_id uuid references public.movimientos_caja(id);

-- Bug relacionado en el mismo lugar: "gastos cobrados al comprador" creaba
-- un movimiento_caja NUEVO cada vez que se guardaba la pestaña (aunque el
-- monto no hubiera cambiado) — duplicaba el ingreso en Finanzas cada vez
-- que alguien tocaba "Guardar cambios" de nuevo. Mismo patrón reversible.
create or replace function public.registrar_extra_cobrado_venta(
  p_venta_id uuid, p_monto numeric, p_moneda text, p_cuenta_id uuid default null,
  p_forma_pago text default null, p_detalle text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venta record;
  v_movimiento_id uuid;
begin
  select * into v_venta from public.ventas where id = p_venta_id;
  if v_venta is null then
    raise exception 'Venta no encontrada.';
  end if;

  if v_venta.extra_cobrado_movimiento_id is not null then
    perform public.eliminar_movimiento_caja(v_venta.extra_cobrado_movimiento_id, 'Gastos cobrados al comprador corregidos/revertidos');
    v_venta.extra_cobrado_movimiento_id := null;
  end if;

  if p_monto is not null and p_monto > 0 and p_cuenta_id is not null then
    if (select moneda from public.cuentas where id = p_cuenta_id) <> p_moneda then
      raise exception 'La caja elegida no es de la misma moneda que el monto cobrado.';
    end if;
    v_movimiento_id := public.registrar_movimiento_caja(
      'ingreso', p_monto, p_cuenta_id, current_date, 'Gastos cobrados al comprador', p_forma_pago, v_venta.vehiculo_id, v_venta.cliente_id, p_venta_id,
      coalesce(p_detalle, 'Gastos cobrados al comprador')
    );
    update public.movimientos_caja set telefono = v_venta.comprador_telefono, patente = v_venta.vehiculo_patente where id = v_movimiento_id;
  end if;

  update public.ventas
  set extra_cobrado_monto = p_monto, extra_cobrado_moneda = p_moneda, extra_cobrado_detalle = p_detalle,
      extra_cobrado_forma_pago = p_forma_pago, extra_cobrado_cuenta_id = p_cuenta_id, extra_cobrado_movimiento_id = v_movimiento_id
  where id = p_venta_id;
end;
$$;

create or replace function public.registrar_pago_comprador_venta(
  p_venta_id uuid, p_confirmado boolean, p_fecha date default current_date,
  p_metodo text default null, p_cuenta_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venta record;
  v_cuenta_moneda text;
  v_senas_confirmadas numeric;
  v_saldo numeric;
  v_movimiento_id uuid;
begin
  select * into v_venta from public.ventas where id = p_venta_id;
  if v_venta is null then
    raise exception 'Venta no encontrada.';
  end if;

  -- Revertir el movimiento anterior primero — sea porque se destilda el
  -- pago, se cambia de caja, o se vuelve a confirmar (evita duplicar).
  if v_venta.comprador_pago_movimiento_id is not null then
    perform public.eliminar_movimiento_caja(v_venta.comprador_pago_movimiento_id, 'Pago de comprador corregido/revertido');
    v_venta.comprador_pago_movimiento_id := null;
  end if;

  if not p_confirmado then
    update public.ventas
    set comprador_pago_confirmado = false, comprador_pago_fecha = p_fecha, comprador_metodo_pago = p_metodo,
        comprador_cuenta_id = null, comprador_pago_movimiento_id = null
    where id = p_venta_id;
    return;
  end if;

  if p_cuenta_id is null then
    raise exception 'Elegí de qué caja entra el pago.';
  end if;

  select moneda into v_cuenta_moneda from public.cuentas where id = p_cuenta_id;
  if v_cuenta_moneda is null then
    raise exception 'Caja no encontrada.';
  end if;
  if v_cuenta_moneda <> v_venta.moneda_venta then
    raise exception 'La caja elegida es en % y la venta es en % — no se puede acreditar así.', v_cuenta_moneda, v_venta.moneda_venta;
  end if;

  select coalesce(sum(monto), 0) into v_senas_confirmadas
  from public.venta_senas
  where venta_id = p_venta_id and estado = 'confirmada' and moneda = v_venta.moneda_venta;

  v_saldo := v_venta.precio_venta - v_senas_confirmadas;

  if v_saldo > 0 then
    v_movimiento_id := public.registrar_movimiento_caja(
      'ingreso', v_saldo, p_cuenta_id, p_fecha, 'Venta — saldo comprador', p_metodo, v_venta.vehiculo_id, v_venta.cliente_id, p_venta_id,
      'Saldo cobrado al comprador — ' || coalesce(v_venta.comprador_nombre, '')
    );
  end if;

  update public.ventas
  set comprador_pago_confirmado = true, comprador_pago_fecha = p_fecha, comprador_metodo_pago = p_metodo,
      comprador_cuenta_id = p_cuenta_id, comprador_pago_movimiento_id = v_movimiento_id
  where id = p_venta_id;
end;
$$;

-- Pagar al propietario/vendedor (lo que la agencia le debe entregar por el
-- auto) — misma lógica, egreso en vez de ingreso, monto = precio_propietario
-- del expediente (lo carga Finanzas en la pestaña Liquidación).
create or replace function public.registrar_pago_vendedor_venta(
  p_venta_id uuid, p_estado text, p_fecha date default current_date, p_cuenta_id uuid default null, p_notas text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venta record;
  v_expediente record;
  v_cuenta_moneda text;
  v_movimiento_id uuid;
begin
  if p_estado not in ('pendiente', 'en_proceso', 'pagado') then
    raise exception 'Estado de pago inválido.';
  end if;

  select * into v_venta from public.ventas where id = p_venta_id;
  if v_venta is null then
    raise exception 'Venta no encontrada.';
  end if;

  if v_venta.pago_vendedor_movimiento_id is not null then
    perform public.eliminar_movimiento_caja(v_venta.pago_vendedor_movimiento_id, 'Pago a propietario/vendedor corregido/revertido');
    v_venta.pago_vendedor_movimiento_id := null;
  end if;

  if p_estado <> 'pagado' then
    update public.ventas
    set estado_pago_tesoreria = p_estado, cuenta_pago_vendedor_id = null, pago_vendedor_movimiento_id = null, notas_tesoreria = p_notas
    where id = p_venta_id;
    return;
  end if;

  select * into v_expediente from public.expedientes where venta_id = p_venta_id;
  if v_expediente is null or v_expediente.precio_propietario is null or v_expediente.precio_propietario <= 0 then
    raise exception 'Cargá el precio al propietario en el expediente (pestaña Liquidación) antes de marcarlo pagado.';
  end if;

  if p_cuenta_id is null then
    raise exception 'Elegí de qué caja sale el pago al propietario.';
  end if;

  select moneda into v_cuenta_moneda from public.cuentas where id = p_cuenta_id;
  if v_cuenta_moneda is null then
    raise exception 'Caja no encontrada.';
  end if;
  if v_cuenta_moneda <> v_expediente.precio_propietario_moneda then
    raise exception 'La caja elegida es en % y el precio al propietario está en % — no se puede pagar así.', v_cuenta_moneda, v_expediente.precio_propietario_moneda;
  end if;

  v_movimiento_id := public.registrar_movimiento_caja(
    'egreso', v_expediente.precio_propietario, p_cuenta_id, p_fecha, 'Venta — pago a propietario', null, v_venta.vehiculo_id, null, p_venta_id,
    'Pago al propietario/vendedor — ' || coalesce(v_venta.propietario_nombre, v_venta.comprador_nombre, '')
  );

  update public.ventas
  set estado_pago_tesoreria = 'pagado', fecha_pago_vendedor = p_fecha, cuenta_pago_vendedor_id = p_cuenta_id,
      pago_vendedor_movimiento_id = v_movimiento_id, notas_tesoreria = p_notas
  where id = p_venta_id;
end;
$$;
