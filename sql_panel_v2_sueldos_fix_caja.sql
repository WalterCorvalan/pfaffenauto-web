-- Fix (auditoría 2026-09-03): guardar una liquidación de sueldo nunca
-- tocaba movimientos_caja — el sueldo quedaba anotado en
-- liquidaciones_sueldo pero jamás salía de ninguna cuenta real, Tesorería/
-- Finanzas no lo veían como egreso. Mismo patrón ya aplicado a comisiones
-- (sql_panel_v2_comisiones_fix_caja.sql).
--
-- Se agrega un estado explícito (generada/pagada) + cuenta_id/movimiento_id
-- para saber de qué caja salió y poder revertir. El "Guardar" del liquidador
-- (cálculo) sigue igual — separado del nuevo "Marcar como pagada", que es
-- el que de verdad debita la caja vía registrar_movimiento_caja.

alter table public.liquidaciones_sueldo
  add column if not exists estado text not null default 'generada' check (estado in ('generada', 'pagada')),
  add column if not exists cuenta_id uuid references public.cuentas(id),
  add column if not exists movimiento_id uuid references public.movimientos_caja(id),
  add column if not exists fecha_pago date;

create or replace function public.pagar_liquidacion_sueldo(p_liquidacion_id uuid, p_cuenta_id uuid, p_fecha date default current_date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_liq record;
  v_movimiento_id uuid;
  v_nombre text;
begin
  if not exists (select 1 from public.perfiles where id = auth.uid() and ('admin' = any(roles) or 'finanzas' = any(roles))) then
    raise exception 'Solo Admin o Finanzas pueden marcar un sueldo como pagado.';
  end if;

  select * into v_liq from public.liquidaciones_sueldo where id = p_liquidacion_id;
  if v_liq is null then
    raise exception 'Liquidación no encontrada.';
  end if;
  if v_liq.estado = 'pagada' then
    raise exception 'Esta liquidación ya está marcada como pagada.';
  end if;

  select nombre into v_nombre from public.perfiles where id = v_liq.perfil_id;

  v_movimiento_id := public.registrar_movimiento_caja(
    'egreso', v_liq.total_final, p_cuenta_id, p_fecha, 'Sueldo', null, null, null, null,
    'Sueldo ' || coalesce(v_nombre, '') || ' — ' || to_char(v_liq.mes, 'MM/YYYY')
  );

  update public.liquidaciones_sueldo
  set estado = 'pagada', cuenta_id = p_cuenta_id, movimiento_id = v_movimiento_id, fecha_pago = p_fecha, updated_at = now()
  where id = p_liquidacion_id;
end;
$$;

-- Revertir el pago: revierte el movimiento de caja y vuelve la liquidación
-- a "generada" (permite corregir el cálculo y volver a pagar).
create or replace function public.quitar_pago_liquidacion_sueldo(p_liquidacion_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_liq record;
begin
  if not exists (select 1 from public.perfiles where id = auth.uid() and ('admin' = any(roles) or 'finanzas' = any(roles))) then
    raise exception 'Solo Admin o Finanzas pueden revertir un pago de sueldo.';
  end if;

  select * into v_liq from public.liquidaciones_sueldo where id = p_liquidacion_id;
  if v_liq is null then
    raise exception 'Liquidación no encontrada.';
  end if;
  if v_liq.movimiento_id is not null then
    perform public.eliminar_movimiento_caja(v_liq.movimiento_id, 'Pago de sueldo revertido');
  end if;

  update public.liquidaciones_sueldo
  set estado = 'generada', cuenta_id = null, movimiento_id = null, fecha_pago = null, updated_at = now()
  where id = p_liquidacion_id;
end;
$$;
