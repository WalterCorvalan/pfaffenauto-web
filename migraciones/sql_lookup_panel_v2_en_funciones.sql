select proname, pg_get_functiondef(oid) as definicion
from pg_proc
where pronamespace = 'public'::regnamespace
  and pg_get_functiondef(oid) ilike '%panel-v2%';
