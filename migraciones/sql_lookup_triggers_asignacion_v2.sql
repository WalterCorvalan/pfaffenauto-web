select proname as funcion, pg_get_functiondef(oid) as definicion
from pg_proc
where pronamespace = 'public'::regnamespace
and proname ilike '%asignar_vendedor%';
