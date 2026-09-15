-- El usuario intentó cargar un vehículo (Kymco) con categoría "Moto" en Stock
-- y la base lo rechazó: "new row for relation "vehiculos" violates check
-- constraint "vehiculos_categoria_check"". El frontend (NuevoVehiculoModal.tsx
-- CATEGORIAS) se amplió de 5 a 9 valores (se agregaron Camión, Camioneta,
-- Casa Rodante, Ómnibus | Van), pero la restricción CHECK de la base nunca
-- se actualizó para permitir ninguno de los valores nuevos, incluido "Moto"
-- que ya era una opción del formulario antes de este cambio.
alter table public.vehiculos
  drop constraint if exists vehiculos_categoria_check;

alter table public.vehiculos
  add constraint vehiculos_categoria_check
  check (categoria in (
    'Auto', 'Pickup/Camioneta', 'SUV', 'Utilitario', 'Moto',
    'Camión', 'Camioneta', 'Casa Rodante', 'Ómnibus | Van'
  ));
