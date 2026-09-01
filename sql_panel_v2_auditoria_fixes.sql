-- Fixes de la auditoría (ver_peritajes_publico exponía todos los peritajes
-- a cualquier visitante anónimo, incluso de autos que nunca llegan a stock
-- público; se acota al mismo criterio que ya usa "vehiculos").
drop policy if exists "ver_peritajes_publico" on public.peritajes;
create policy "ver_peritajes_publico" on public.peritajes for select to anon
  using (exists (
    select 1 from public.vehiculos v
    where v.id = peritajes.vehiculo_id and v.estado = 'disponible'
  ));

-- Índices en las FK que sí se filtran/joinean seguido en el código actual
-- (el resto de las 89 sin índice son columnas de auditoría tipo creado_por,
-- que no vale la pena indexar todavía).
create index if not exists ventas_cliente_idx on public.ventas(cliente_id);
create index if not exists ventas_vehiculo_idx on public.ventas(vehiculo_id);
create index if not exists vehiculos_sucursal_idx on public.vehiculos(sucursal_id);
create index if not exists cotizaciones_cliente_idx on public.cotizaciones(cliente_id);
create index if not exists whatsapp_conversaciones_cliente_idx on public.whatsapp_conversaciones(cliente_id);
create index if not exists whatsapp_conversaciones_vendedor_idx on public.whatsapp_conversaciones(vendedor_id);
create index if not exists pedidos_cliente_idx on public.pedidos(cliente_id);
create index if not exists visitas_cliente_idx on public.visitas(cliente_id);
create index if not exists consignaciones_cliente_idx on public.consignaciones(cliente_id);
