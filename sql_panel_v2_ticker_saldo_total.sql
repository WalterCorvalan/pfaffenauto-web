-- Fix (auditoría 2026-09-03): el ticker superior mostraba "Caja: USD 0 · ARS
-- 0" hardcodeado como texto literal — nunca leía nada real. El saldo de
-- una cuenta se calcula con la función saldo_cuenta(id) (saldo_inicial +
-- movimientos aprobados), no es una columna de "cuentas" — no alcanza con
-- un select directo. Para el ticker (una sola fila de texto, se refresca
-- cada 5 min) conviene una función que sume todas las cuentas activas de
-- una sola pasada en vez de N llamadas a saldo_cuenta.

create or replace function public.saldos_totales_por_moneda()
returns table (moneda text, total numeric)
language sql
stable
set search_path = public
as $$
  select c.moneda, sum(
    c.saldo_inicial
    + coalesce((select sum(m.monto) from public.movimientos_caja m where m.cuenta_id = c.id and m.tipo = 'ingreso' and m.deleted_at is null and m.estado = 'aprobado'), 0)
    - coalesce((select sum(m.monto) from public.movimientos_caja m where m.cuenta_id = c.id and m.tipo = 'egreso' and m.deleted_at is null and m.estado = 'aprobado'), 0)
  )
  from public.cuentas c
  where c.activa = true
  group by c.moneda;
$$;
