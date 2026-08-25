-- CRÍTICO (2026-08-25): rol 'taller' tiene permiso de UPDATE en toda la fila
-- de vehiculos (para poder tocar etapa_preparacion desde /panel/taller), pero
-- eso significa que también puede pisar "estado" directo — justo lo que
-- AccionesAuto.tsx dejó de permitir a propósito (el estado solo se mueve por
-- acciones: señas, ventas, archivar vía /api/vehiculos/reservar). Un vendedor
-- ya estaba bloqueado por RLS base, pero taller no.
--
-- Como el candado real que queremos es "nadie edita estado a mano, ni admin
-- ni nadie — solo lo mueve la API con service role", bloqueamos la columna
-- para CUALQUIER sesión de usuario autenticado (auth.uid() no nulo). Las
-- rutas API (/api/vehiculos/reservar) usan la service-role key, que no tiene
-- auth.uid(), así que siguen funcionando sin cambios.
create or replace function public.proteger_estado_vehiculo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado is distinct from old.estado and auth.uid() is not null then
    raise exception 'El estado del vehículo no se edita directo — usá Señas, Ventas o Archivar.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_estado_vehiculo on public.vehiculos;
create trigger trg_proteger_estado_vehiculo
  before update on public.vehiculos
  for each row
  execute function public.proteger_estado_vehiculo();
