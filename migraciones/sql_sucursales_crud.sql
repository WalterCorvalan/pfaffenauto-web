-- Pedido del usuario (30/9): pantalla en Configuración para crear/editar/
-- eliminar sucursales, sin depender del hardcodeo que hoy vive en
-- app/(public)/sucursales/[slug]/page.tsx (FALLBACK_DATA, GEO_SUCURSALES),
-- SucursalHeroAnimated.tsx (UBICACIONES) y EstadoHorario.tsx (horario fijo
-- lun-sáb 9-19 para TODAS las sucursales). Se agregan las columnas que
-- faltaban para que esos 3 archivos puedan leer todo de la base en vez de
-- un mapa hardcodeado por slug.
--
-- Correr una vez en el SQL editor de Supabase y borrar este archivo del
-- repo después (mismo criterio que el resto de migraciones/*.sql).

ALTER TABLE public.sucursales ADD COLUMN IF NOT EXISTS imagen_url text;
ALTER TABLE public.sucursales ADD COLUMN IF NOT EXISTS horario_texto text;
ALTER TABLE public.sucursales ADD COLUMN IF NOT EXISTS horario_dia_desde smallint NOT NULL DEFAULT 1;
ALTER TABLE public.sucursales ADD COLUMN IF NOT EXISTS horario_dia_hasta smallint NOT NULL DEFAULT 6;
ALTER TABLE public.sucursales ADD COLUMN IF NOT EXISTS horario_hora_desde numeric NOT NULL DEFAULT 9;
ALTER TABLE public.sucursales ADD COLUMN IF NOT EXISTS horario_hora_hasta numeric NOT NULL DEFAULT 19;
ALTER TABLE public.sucursales ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.sucursales ADD COLUMN IF NOT EXISTS longitude numeric;

-- Backfill de las 2 sucursales existentes con los valores que hoy están
-- hardcodeados en el código, para que no se pierda nada al sacar los mapas
-- FALLBACK_DATA/GEO_SUCURSALES/UBICACIONES. COALESCE en google_maps_url
-- para no pisar un valor real si ya estuviera cargado.
UPDATE public.sucursales SET
  imagen_url = COALESCE(imagen_url, '/VDM.jpeg'),
  horario_texto = COALESCE(horario_texto, 'Lun a Sáb - 9:00 a 19:00hs'),
  latitude = COALESCE(latitude, -34.4889306),
  longitude = COALESCE(longitude, -58.6614257),
  google_maps_url = COALESCE(google_maps_url, 'https://maps.app.goo.gl/4ZMmpWJCarHcZ2sb9')
WHERE slug = 'casa-central';

UPDATE public.sucursales SET
  imagen_url = COALESCE(imagen_url, '/pana.jpg'),
  horario_texto = COALESCE(horario_texto, 'Lun a Sáb - 9:00 a 19:00hs'),
  latitude = COALESCE(latitude, -34.4840351),
  longitude = COALESCE(longitude, -58.619739),
  google_maps_url = COALESCE(google_maps_url, 'https://maps.app.goo.gl/GuNBuUKT5xMFw5jR9')
WHERE slug = 'don-torcuato';

-- Cualquier otra sucursal que ya exista sin estos datos (no debería haber
-- ninguna más, pero por las dudas) queda con el horario genérico por
-- default (lun-sáb 9-19, ya seteado por el DEFAULT de la columna) y sin
-- imagen -- la UI pública tiene un fallback genérico para ese caso (ver
-- cambios de código).
