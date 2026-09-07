-- Vincula una fila de venta_senas con la seña original del módulo Señas
-- (senas.id) -- antes "Agregar seña" en Nueva Venta era un formulario libre
-- sin ninguna conexión con la tabla senas, obligando a cargar el mismo dato
-- dos veces y dejando la seña original huérfana al convertirse.
alter table venta_senas add column if not exists sena_origen_id uuid references senas(id);
