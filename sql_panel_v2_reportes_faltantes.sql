-- v_reportes_top_clientes (sql_panel_v2_reportes.sql) solo trae monto_total
-- mezclando USD/ARS, pero ReportesClient.tsx pinta columnas separadas
-- monto_usd/monto_ars — nunca hay que sumar monedas distintas. Se
-- redefine acá con el desglose real por moneda.
drop view if exists public.v_reportes_top_clientes;
create view public.v_reportes_top_clientes as
  select c.id as cliente_id, c.nombre,
    count(v.id) as compras,
    coalesce(sum(v.precio_venta) filter (where v.moneda_venta = 'USD'), 0) as monto_usd,
    coalesce(sum(v.precio_venta) filter (where v.moneda_venta = 'ARS'), 0) as monto_ars
  from public.clientes c
  join public.ventas v on v.cliente_id = c.id and v.estado = 'cerrada'
  group by c.id, c.nombre
  order by compras desc, monto_usd desc
  limit 10;

-- Panel v2 — Reportes: vistas que app/panel-v2/reportes/page.tsx ya llamaba
-- por RPC (reportes_expedientes_resumen, reportes_expedientes_por_estado,
-- reportes_infracciones_resumen, reportes_taller_facturacion) y una tabla
-- (v_reportes_infracciones_por_mes) pero nunca se habían creado — las
-- llamadas fallaban en silencio y esos bloques del reporte quedaban en 0.
-- Sumo estas vistas y actualizo page.tsx para consultarlas por SELECT
-- (mismo patrón que el resto de sql_panel_v2_reportes.sql), en vez de RPC.

create or replace view public.v_reportes_expedientes_resumen as
  select count(*) as total,
         count(*) filter (where estado <> 'cerrado') as activos,
         count(*) filter (where estado = 'cerrado') as cerrados,
         count(*) filter (where estado <> 'cerrado' and vencimiento is not null and vencimiento < current_date) as vencidos
  from public.expedientes
  where archivado = false;

create or replace view public.v_reportes_expedientes_por_estado as
  select estado, count(*) as cantidad
  from public.expedientes
  where archivado = false
  group by estado;

-- Taller no existe todavía como módulo — misma limitación que
-- v_reportes_service_posventa (sql_panel_v2_reportes.sql): factura_cobrada
-- y conteos de OT quedan en 0 hasta que se construya.
create or replace view public.v_reportes_taller_facturacion as
  select 0::numeric as facturado_cobrado, 0 as ots_cobradas, 0 as ots_generadas;

create or replace view public.v_reportes_infracciones_resumen as
  select count(*) as total,
         count(*) filter (where estado = 'Pendiente') as pendientes,
         count(*) filter (where estado = 'Pagado') as pagadas,
         coalesce(sum(ganancia_ars) filter (where estado = 'Pagado'), 0) as ganancia_total
  from public.infracciones
  where date_trunc('month', mes) = date_trunc('month', now());

create or replace view public.v_reportes_infracciones_por_mes as
  select mes, count(*) as cantidad,
         coalesce(sum(ganancia_ars) filter (where estado = 'Pagado'), 0) as ganancia_ars
  from public.infracciones
  group by mes
  order by mes desc
  limit 12;

do $$
declare
  v text;
begin
  foreach v in array array[
    'v_reportes_expedientes_resumen','v_reportes_expedientes_por_estado',
    'v_reportes_taller_facturacion','v_reportes_infracciones_resumen','v_reportes_infracciones_por_mes',
    'v_reportes_top_clientes'
  ]
  loop
    execute format('alter view public.%I set (security_invoker = true)', v);
    execute format('grant select on public.%I to authenticated', v);
  end loop;
end $$;
