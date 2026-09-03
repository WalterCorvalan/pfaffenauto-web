-- Fix (auditoría 2026-09-03): registrar_pago_parcial_comision nunca tocaba
-- movimientos_caja, ni pago interno ni externo. El checkbox del modal dice
-- "Pago Externo (No descuenta de caja local)" — implica que SIN tildar,
-- SÍ debería descontar de una caja real. Nunca lo hizo: pagar una comisión
-- "de caja local" no dejaba ningún rastro en Finanzas, ni gastaba plata de
-- ninguna cuenta de verdad.
--
-- Fix: agrega cuenta_id a comision_pagos (para saber de qué caja salió, y
-- poder revertir), y cuando NO es pago externo, exige una caja y la debita
-- de verdad vía registrar_movimiento_caja (mismo motor money-safety que
-- usa el resto de Finanzas — respeta umbral/autorización si el pago es
-- grande).

alter table public.comision_pagos
  add column if not exists cuenta_id uuid references public.cuentas(id),
  add column if not exists movimiento_id uuid references public.movimientos_caja(id);

drop function if exists public.registrar_pago_parcial_comision(uuid, numeric, boolean, date);
create or replace function public.registrar_pago_parcial_comision(
  p_comision_id uuid, p_monto numeric, p_pago_externo boolean default false, p_fecha date default current_date, p_cuenta_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comision record;
  v_nuevo_pagado numeric;
  v_movimiento_id uuid;
begin
  if not exists (select 1 from public.perfiles where id = auth.uid() and ('admin' = any(roles) or 'finanzas' = any(roles))) then
    raise exception 'Solo Admin o Finanzas pueden registrar pagos.';
  end if;

  select * into v_comision from public.comisiones where id = p_comision_id;
  if v_comision is null then
    raise exception 'Comisión no encontrada.';
  end if;

  if not p_pago_externo then
    if p_cuenta_id is null then
      raise exception 'Elegí de qué caja sale el pago (o marcá "Pago Externo" si no sale de una caja nuestra).';
    end if;
    v_movimiento_id := public.registrar_movimiento_caja(
      'egreso', p_monto, p_cuenta_id, p_fecha, 'Pago de comisión', null, null, null, v_comision.venta_id,
      coalesce(v_comision.concepto, initcap(v_comision.tipo) || ' — comisión')
    );
  end if;

  insert into public.comision_pagos (comision_id, monto, pago_externo, fecha, registrado_por, cuenta_id, movimiento_id)
  values (p_comision_id, p_monto, p_pago_externo, p_fecha, auth.uid(), p_cuenta_id, v_movimiento_id);

  v_nuevo_pagado := v_comision.monto_pagado + p_monto;

  update public.comisiones
  set monto_pagado = v_nuevo_pagado,
      estado = case when v_nuevo_pagado >= monto then 'cobrada' else estado end,
      fecha_cobro = case when v_nuevo_pagado >= monto then coalesce(fecha_cobro, p_fecha) else fecha_cobro end,
      updated_at = now()
  where id = p_comision_id;
end;
$$;

-- Revertir un pago puntual: revierte el movimiento de caja (si lo hubo) y
-- recalcula monto_pagado/estado desde la fuente (comision_pagos), mismo
-- patrón que quitar_cuota_pago en Finanzas.
create or replace function public.quitar_pago_comision(p_pago_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pago record;
  v_comision_id uuid;
  v_total_pagado numeric;
  v_monto numeric;
begin
  if not exists (select 1 from public.perfiles where id = auth.uid() and ('admin' = any(roles) or 'finanzas' = any(roles))) then
    raise exception 'Solo Admin o Finanzas pueden revertir un pago.';
  end if;

  select * into v_pago from public.comision_pagos where id = p_pago_id;
  if v_pago is null then raise exception 'Pago no encontrado.'; end if;
  v_comision_id := v_pago.comision_id;

  if v_pago.movimiento_id is not null then
    perform public.eliminar_movimiento_caja(v_pago.movimiento_id, 'Pago de comisión revertido');
  end if;

  delete from public.comision_pagos where id = p_pago_id;

  select coalesce(sum(monto), 0) into v_total_pagado from public.comision_pagos where comision_id = v_comision_id;
  select monto into v_monto from public.comisiones where id = v_comision_id;

  update public.comisiones
  set monto_pagado = v_total_pagado, estado = case when v_total_pagado >= v_monto then 'cobrada' else 'pendiente' end,
      fecha_cobro = case when v_total_pagado >= v_monto then fecha_cobro else null end,
      updated_at = now()
  where id = v_comision_id;
end;
$$;
