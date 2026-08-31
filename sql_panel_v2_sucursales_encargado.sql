alter table public.sucursales add column if not exists encargado_nombre text;

update public.sucursales set encargado_nombre = 'Gabriel Pfaffen' where nombre = 'Casa Central';
update public.sucursales set encargado_nombre = 'Lucas Gatti' where nombre = 'Don Torcuato';
