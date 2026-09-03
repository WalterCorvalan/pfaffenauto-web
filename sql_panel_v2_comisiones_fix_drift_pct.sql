-- Fix (auditoría 2026-09-03): editar el % de comisión (o el precio) de una
-- venta YA cerrada no recalculaba la fila ya generada en `comisiones` —
-- generar_comisiones_al_cerrar_venta solo dispara con `update of estado`,
-- y a propósito no vuelve a correr si la venta ya estaba 'cerrada' (evita
-- duplicar filas). Resultado: el % en `ventas` cambia, pero el monto ya
-- materializado en `comisiones` queda congelado con el % viejo — Ventas
-- muestra un número, Mis Comisiones/Comisiones muestran otro, para la
-- misma operación.
--
-- Fix aislado y aditivo: un trigger NUEVO, separado del de creación (no se
-- toca generar_comisiones_al_cerrar_venta en absoluto), que solo actúa
-- cuando la venta YA está cerrada y cambia el %/precio — recalcula el
-- monto de la comisión correspondiente, pero SOLO si sigue 'pendiente'.
-- Una comisión ya 'cobrada' NUNCA se toca: esa plata ya se pagó, tocar su
-- monto después sería reescribir un pago que ya ocurrió.

create or replace function public.sincronizar_comisiones_pct_venta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado <> 'cerrada' then
    return new;
  end if;

  if new.comision_vendedor_pct is distinct from old.comision_vendedor_pct or new.precio_venta is distinct from old.precio_venta then
    update public.comisiones
    set monto = new.precio_venta * coalesce(new.comision_vendedor_pct, 0) / 100, updated_at = now()
    where venta_id = new.id and tipo = 'vendedor' and estado = 'pendiente';
  end if;

  if new.vendedor_compartido_pct is distinct from old.vendedor_compartido_pct or new.precio_venta is distinct from old.precio_venta then
    update public.comisiones
    set monto = new.precio_venta * coalesce(new.vendedor_compartido_pct, 0) / 100, updated_at = now()
    where venta_id = new.id and tipo = 'vendedor_compartido' and estado = 'pendiente';
  end if;

  if new.comision_consignacion_pct is distinct from old.comision_consignacion_pct or new.precio_venta is distinct from old.precio_venta then
    update public.comisiones
    set monto = new.precio_venta * coalesce(new.comision_consignacion_pct, 0) / 100, updated_at = now()
    where venta_id = new.id and tipo = 'consignacion' and estado = 'pendiente';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sincronizar_comisiones_pct on public.ventas;
create trigger trg_sincronizar_comisiones_pct
  after update of comision_vendedor_pct, comision_consignacion_pct, vendedor_compartido_pct, precio_venta on public.ventas
  for each row execute function public.sincronizar_comisiones_pct_venta();
