-- Fix: la alerta de "match" de pedidos linkeaba a /panel/pedidos (ruta de
-- v1) en vez de /panel-v2/pedidos. Redefine la función solo para corregir
-- ese link, sin tocar el resto de la lógica de matching.

create or replace function public.pedidos_detectar_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido record;
  v_link text;
  v_encargado record;
begin
  if new.estado not in ('disponible', 'reservado') then
    return new;
  end if;

  for v_pedido in
    select * from public.pedidos
    where estado = 'activo'
      and vehiculo_match_id is null
      and marca ilike new.marca
      and (modelo is null or new.modelo ilike '%' || modelo || '%')
      and (anio_desde is null or new.anio >= anio_desde)
      and (anio_hasta is null or new.anio <= anio_hasta)
      and (presupuesto_max is null or moneda <> new.moneda_venta or new.precio_venta <= presupuesto_max)
  loop
    update public.pedidos
      set vehiculo_match_id = new.id, match_detectado_at = now()
      where id = v_pedido.id;

    v_link := '/panel-v2/pedidos?pedido=' || v_pedido.id;

    if v_pedido.vendedor_id is not null then
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_pedido.vendedor_id, 'pedido_match', 'alta', 'Entró un auto para ' || v_pedido.nombre_cliente || ' (' || new.marca || ' ' || new.modelo || ')', v_link);
    else
      for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (v_encargado.id, 'pedido_match', 'alta', 'Entró un auto para ' || v_pedido.nombre_cliente || ' (' || new.marca || ' ' || new.modelo || ')', v_link);
      end loop;
    end if;
  end loop;

  return new;
end;
$$;
