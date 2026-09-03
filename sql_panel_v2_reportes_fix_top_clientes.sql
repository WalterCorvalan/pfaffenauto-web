-- Fix (2026-09-03, armando Reportes): v_reportes_top_clientes sumaba
-- precio_venta de todas las ventas del cliente sin separar por moneda —
-- un cliente con una compra en ARS y otra en USD mostraba un "monto total"
-- que mezclaba ambas, sin sentido. Se separa en dos columnas.
drop view if exists public.v_reportes_top_clientes;
create view public.v_reportes_top_clientes as
  select c.id as cliente_id, c.nombre,
         count(v.id) as compras,
         coalesce(sum(v.precio_venta) filter (where v.moneda_venta = 'ARS'), 0) as monto_ars,
         coalesce(sum(v.precio_venta) filter (where v.moneda_venta = 'USD'), 0) as monto_usd
  from public.clientes c
  join public.ventas v on v.cliente_id = c.id and v.estado = 'cerrada'
  group by c.id, c.nombre
  order by compras desc, monto_usd desc, monto_ars desc
  limit 10;

grant select on public.v_reportes_top_clientes to authenticated;
