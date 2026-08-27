-- "ubicación" (playón/predio) duplicaba lo que ya dice "sucursal" — nunca se
-- llegó a usar en la práctica. Se sacó del form y de la lista de stock.
alter table public.vehiculos drop column if exists ubicacion;
