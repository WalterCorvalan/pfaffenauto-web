-- (ya no hace falta correr este -- fue la consulta 1 del combo original,
-- que confirmó que "mensajes" no tenía trigger. Se deja por las dudas.)
select tgname, tgrelid::regclass as tabla, pg_get_triggerdef(oid) as definicion
from pg_trigger
where tgrelid = 'public.mensajes'::regclass and not tgisinternal;
