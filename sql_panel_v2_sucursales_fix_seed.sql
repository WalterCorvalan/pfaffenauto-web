-- Corrige el seed de sucursales: v1 usa "Casa Central" y "Don Torcuato"
-- (data/NegocioConfig.ts), no "Salón Principal". Renombra la fila sembrada
-- por la migración anterior y agrega la que falta. Aditivo, no borra nada
-- que el usuario haya cargado a mano.

update public.sucursales set nombre = 'Casa Central' where nombre = 'Salón Principal';

insert into public.sucursales (nombre) values ('Don Torcuato') on conflict (nombre) do nothing;
