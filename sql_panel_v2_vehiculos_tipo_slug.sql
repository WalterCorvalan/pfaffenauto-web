alter table public.vehiculos
  add column if not exists tipo text check (tipo in ('SUV','Hatchback','Pickup','Sedán','Auto','Utilitarios')),
  add column if not exists slug text unique;

alter table public.sucursales
  add column if not exists slug text unique;
