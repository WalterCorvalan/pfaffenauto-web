-- Fix: los triggers de sincronización vehiculo<->mandato (auditoría) solo
-- escuchaban UPDATE OF vehiculo_id / mandato_id. Si el mandato se crea con
-- vehiculo_id ya cargado en el INSERT (el camino normal), nunca sincronizaban
-- el lado contrario. Mismo bug que ya se arregló para el trigger de
-- expedientes — ahora corren también en INSERT.

drop trigger if exists trg_sync_vehiculo_mandato_desde_vehiculo on public.vehiculos;
create trigger trg_sync_vehiculo_mandato_desde_vehiculo
  after insert or update of mandato_id on public.vehiculos
  for each row execute function public.sync_vehiculo_mandato_desde_vehiculo();

create or replace function public.sync_vehiculo_mandato_desde_mandato()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.vehiculo_id is not null and (tg_op = 'INSERT' or new.vehiculo_id is distinct from old.vehiculo_id) then
    update public.vehiculos set mandato_id = new.id where id = new.vehiculo_id and mandato_id is distinct from new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_vehiculo_mandato_desde_mandato on public.mandatos;
create trigger trg_sync_vehiculo_mandato_desde_mandato
  after insert or update of vehiculo_id on public.mandatos
  for each row execute function public.sync_vehiculo_mandato_desde_mandato();

create or replace function public.sync_vehiculo_mandato_desde_vehiculo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.mandato_id is not null and (tg_op = 'INSERT' or new.mandato_id is distinct from old.mandato_id) then
    update public.mandatos set vehiculo_id = new.id where id = new.mandato_id and vehiculo_id is distinct from new.id;
  end if;
  return new;
end;
$$;

-- Backfill: arregla los pares que ya quedaron desincronizados por este bug.
update public.mandatos m set vehiculo_id = v.id
from public.vehiculos v
where v.mandato_id = m.id and m.vehiculo_id is null;

update public.vehiculos v set mandato_id = m.id
from public.mandatos m
where m.vehiculo_id = v.id and v.mandato_id is null;
