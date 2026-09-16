-- Bug #3 de la auditoría de flujo real (cambiar el estado de una venta
-- fallaba siempre, para cualquier estado y cualquier usuario, incluido
-- admin) -- NO era (solo) el trigger log_venta_estado ya corregido en
-- sql_fix_log_venta_estado_security_definer.sql. Reretesteado después de
-- esa migración: el UPDATE ya no tira excepción, pero el .select()
-- posterior devuelve 0 filas -- señal de RLS bloqueando, no de un trigger.
--
-- Causa raíz confirmada con pg_policy: public.ventas tiene una política
-- RESTRICTIVA de UPDATE ("restringir_escritura_ajena_upd", es_permisiva:
-- false) pero NINGUNA política PERMISIVA de UPDATE. En Postgres, una
-- política restrictiva nunca otorga acceso por sí sola -- solo recorta lo
-- que ya permite una permisiva. Sin ninguna permisiva para UPDATE, el
-- comando queda bloqueado para TODO usuario, sin importar el rol --
-- coincide exactamente con "falla para admin y para vendedor por igual".
--
-- Comparar con INSERT, que sí está bien armado en esta misma tabla:
-- "crear_ventas" (permisiva, check true) + "restringir_escritura_ajena_ins"
-- (restrictiva, recorta). A UPDATE le faltaba el equivalente de
-- "crear_ventas". Se agrega acá, dejando que la restrictiva ya existente
-- siga acotando a las mismas condiciones de siempre (dueño de la venta,
-- venta compartida, o admin/finanzas/gestoría).
create policy "editar_ventas" on public.ventas
  for update
  to authenticated
  using (true)
  with check (true);
