-- Vista para Reportes: qué proporción de las ventas cerradas usa
-- financiación/prenda, contrata seguro, o entra con permuta -- mismo
-- patrón que las demás vistas v_reportes_* (singleton, sin parámetros).

create or replace view v_reportes_composicion_ventas as
select
  count(*) filter (where estado = 'cerrada') as total_cerradas,
  count(*) filter (where estado = 'cerrada' and metodo_pago = 'Financiado') as con_financiacion,
  round(100.0 * count(*) filter (where estado = 'cerrada' and metodo_pago = 'Financiado')
    / nullif(count(*) filter (where estado = 'cerrada'), 0)) as pct_financiadas,
  count(*) filter (where estado = 'cerrada' and seguro_contratado) as con_seguro,
  round(100.0 * count(*) filter (where estado = 'cerrada' and seguro_contratado)
    / nullif(count(*) filter (where estado = 'cerrada'), 0)) as pct_seguro,
  count(*) filter (where estado = 'cerrada' and id in (select venta_id from venta_permutas)) as con_permuta,
  round(100.0 * count(*) filter (where estado = 'cerrada' and id in (select venta_id from venta_permutas))
    / nullif(count(*) filter (where estado = 'cerrada'), 0)) as pct_permuta
from ventas;
