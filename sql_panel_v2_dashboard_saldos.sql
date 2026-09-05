-- RPC que usa el Dashboard (app/panel-v2/page.tsx) para las tiles "Balance
-- neto USD/ARS" — nunca existió, la llamada rompía silenciosamente (rpc a
-- función inexistente devuelve error y `saldos` quedaba undefined).
-- Misma lógica que saldo_cuenta() (sql_panel_v2_finanzas.sql) pero agregada
-- por moneda sobre todas las cuentas activas.

create or replace function public.saldos_totales_por_moneda()
returns table (moneda text, total numeric)
language sql
stable
set search_path = public
as $$
  select c.moneda,
    sum(c.saldo_inicial
      + coalesce(m.ingresos, 0)
      - coalesce(m.egresos, 0)
    ) as total
  from public.cuentas c
  left join (
    select cuenta_id,
      sum(case when tipo = 'ingreso' then monto else 0 end) as ingresos,
      sum(case when tipo = 'egreso' then monto else 0 end) as egresos
    from public.movimientos_caja
    where deleted_at is null and estado = 'aprobado'
    group by cuenta_id
  ) m on m.cuenta_id = c.id
  where c.activa = true
  group by c.moneda;
$$;
