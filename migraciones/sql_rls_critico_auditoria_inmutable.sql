-- CRÍTICO (2026-08-25): un vendedor de prueba pudo borrar una fila de
-- historial_cambios (auditoría) — se perdió esa fila real en la prueba, no
-- había forma de confirmar el bug sin un registro real. historial_cambios
-- solo se inserta desde el código (grep confirmado: ningún .update()/.delete()
-- sobre esta tabla en toda la app) — nadie necesita editarla o borrarla nunca,
-- ni siquiera admin. La bloqueamos por completo salvo INSERT.
drop policy if exists "auditoria_bloquear_delete_update" on historial_cambios;
create policy "auditoria_bloquear_delete_update" on historial_cambios as restrictive
  for update to authenticated using (false);

drop policy if exists "auditoria_bloquear_delete" on historial_cambios;
create policy "auditoria_bloquear_delete" on historial_cambios as restrictive
  for delete to authenticated using (false);
