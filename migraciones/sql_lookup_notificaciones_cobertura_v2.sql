-- Qué funciones de trigger insertan en "alertas" hoy (la tabla real detrás
-- de la campanita, no "notificaciones") -- para saber qué eventos SÍ avisan.
select p.proname as funcion
from pg_proc p
where p.pronamespace = 'public'::regnamespace
and pg_get_functiondef(p.oid) ilike '%insert into%alertas%';
