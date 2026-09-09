-- Número de WhatsApp propio de cada vendedor/encargado -- hoy el catálogo,
-- el presupuesto público y el seguimiento público usaban números
-- hardcodeados/de ejemplo (5491100000000 con TODO literal, +54 9 11
-- 1234-5678). La cadena real es: vehículo -> vendedor asignado -> su
-- whatsapp propio; si no tiene, cae al telefono_encargado de la sucursal
-- del vehículo (columna que ya existe en "sucursales").

alter table perfiles
  add column if not exists whatsapp text;

comment on column perfiles.whatsapp is
  'Número de WhatsApp propio (con código de país, sin espacios/guiones -- ej 5491137564398). Si está vacío, el contacto público cae al telefono_encargado de la sucursal.';
