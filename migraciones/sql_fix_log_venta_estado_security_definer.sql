-- Bug encontrado en la auditoría de flujo real del panel (guía en
-- testing/guia-flujo-real-panel): cambiar el estado de CUALQUIER venta
-- (a Reserva, Cerrada, lo que sea) fallaba siempre, para cualquier usuario
-- (probado con un vendedor no-admin y con admin), con
-- "Cannot coerce the result to a single JSON object" -- que en realidad
-- tapaba una transacción abortada, no un problema de .select().single()
-- (el código del panel ya usa .maybeSingle() en los guardados de venta).
--
-- Causa raíz: el trigger trg_log_venta_estado (función log_venta_estado())
-- corre en CADA cambio de estado (no solo al cerrar) e inserta un registro
-- en public.venta_estado_historial. Esa tabla tiene RLS habilitado con una
-- única política, de SELECT ("ver_venta_estado_historial") -- nunca se le
-- agregó una de INSERT. Como log_venta_estado() no estaba marcada
-- security definer, el insert corría con los permisos del usuario que
-- editaba la venta y RLS lo rechazaba sin excepción explícita, abortando
-- toda la transacción del UPDATE sobre ventas -- por eso fallaba para
-- cualquier estado destino y para cualquier usuario, incluido admin.
--
-- Mismo patrón que ya usa registrar_historial_cambios() (el trigger de
-- historial genérico de ventas) para poder escribir su propia tabla de
-- auditoría sin depender del permiso de INSERT del usuario que edita --
-- log_venta_estado() se había quedado afuera de esa convención.
create or replace function public.log_venta_estado()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if tg_op = 'INSERT' or new.estado is distinct from old.estado then
    insert into public.venta_estado_historial (venta_id, estado, autor_id)
    values (new.id, new.estado, auth.uid());
  end if;
  return new;
end;
$function$;
