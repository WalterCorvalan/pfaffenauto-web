-- Fix (auditoría 2026-09-03, probando "vender desde cliente/lead"): al
-- cerrar una venta con cliente_id vinculado a un lead YA existente,
-- clientes.pipeline_stage nunca pasaba a 'cerrado' — solo lo hacía el
-- walk-in creado desde cero en NuevaVentaModal (resolverCliente). Resultado:
-- funnel_vendedor (usado en Mis Ventas / Performance del equipo) no contaba
-- la venta real como "vendido" para ningún lead que ya estuviera cargado
-- como cliente antes de vender — solo para el caso de mostrador sin lead
-- previo. Pasa tanto al cerrar la venta al crearla como al hacer la
-- transición de estado activa/reserva → cerrada (VentaDetalleModal).
--
-- Fix aditivo: trigger nuevo en ventas, no toca generar_comisiones_al_
-- cerrar_venta ni ninguna otra lógica de cierre.

create or replace function public.marcar_cliente_cerrado_al_cerrar_venta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado <> 'cerrada' or (tg_op = 'UPDATE' and old.estado = 'cerrada') then
    return new;
  end if;
  if new.cliente_id is not null then
    update public.clientes
    set pipeline_stage = 'cerrado', pipeline_stage_manual = true
    where id = new.cliente_id and pipeline_stage <> 'cerrado';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_marcar_cliente_cerrado_al_cerrar_venta on public.ventas;
create trigger trg_marcar_cliente_cerrado_al_cerrar_venta
  after insert or update on public.ventas
  for each row execute function public.marcar_cliente_cerrado_al_cerrar_venta();
