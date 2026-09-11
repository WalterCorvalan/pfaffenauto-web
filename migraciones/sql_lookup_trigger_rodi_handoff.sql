-- Solo lectura -- pegame el resultado, no cambia nada en la base.
select
  t.tgname as trigger_name,
  pg_get_triggerdef(t.oid) as trigger_def,
  p.prosrc as function_body
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
where t.tgname = 'trg_rodi_handoff';
