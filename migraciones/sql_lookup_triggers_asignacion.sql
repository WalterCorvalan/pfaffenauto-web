select proname as funcion, pg_get_functiondef(oid) as definicion
from pg_proc
where proname in (
  'asignar_vendedor_conversacion',
  'asignar_vendedor_conversacion_nueva',
  'asignar_vendedor_conversacion_instagram',
  'asignar_vendedor_conversacion_rodi'
)
and pronamespace = 'public'::regnamespace;
