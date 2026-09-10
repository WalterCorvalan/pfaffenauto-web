-- 1) ¿Hay algún trigger en la tabla "mensajes" (chat interno)?
select tgname, tgrelid::regclass as tabla, pg_get_triggerdef(oid) as definicion
from pg_trigger
where tgrelid = 'public.mensajes'::regclass and not tgisinternal;

-- 2) Mapa completo: todas las funciones de trigger que insertan en "notificaciones"
-- (para ver qué eventos SÍ están cubiertos hoy en toda la base)
select p.proname as funcion, pg_get_functiondef(p.oid) as definicion
from pg_proc p
where p.pronamespace = 'public'::regnamespace
and pg_get_functiondef(p.oid) ilike '%insert into%notificaciones%';

-- 3) Qué tablas tienen esas funciones como trigger (para saber el evento disparador)
select event_object_table as tabla, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table;
