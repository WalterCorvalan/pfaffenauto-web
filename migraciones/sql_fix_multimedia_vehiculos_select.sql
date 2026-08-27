-- La policy restrictive "restringir_editar_completo" (sql_rls_multimedia_vehiculos.sql,
-- ya aplicada) exigía el permiso 'vehiculos.editar_completo' para TODO
-- (incluido SELECT) en multimedia_vehiculos. Eso rompía dos cosas:
--   1. Ver las fotos en el panel -- cualquier vendedor sin ese permiso puntual
--      veía el ícono de auto de relleno en vez de la miniatura real.
--   2. Subir/borrar fotos -- el editar_completo es un permiso de más alto
--      nivel (admin/encargado); los vendedores NO lo tienen por diseño, pero
--      SÍ tienen que poder cargar/sacar fotos del auto que están gestionando
--      (VehiculoForm.tsx los manda directo al paso de fotos cuando no tienen
--      editar_completo -- esa es la única edición que se les permite). La
--      policy vieja se lo bloqueaba también a nivel DB, aunque la UI se lo
--      dejaba hacer.
--
-- Fotos: cualquier usuario logueado del panel puede ver/subir/borrar. La
-- restricción real de "qué auto puede tocar" ya vive en la UI/RLS de la
-- tabla vehiculos (editar_completo), no hace falta duplicarla acá.
drop policy if exists "restringir_editar_completo" on public.multimedia_vehiculos;
drop policy if exists "authenticated_select_multimedia_vehiculos" on public.multimedia_vehiculos;

create policy "authenticated_all_multimedia_vehiculos"
  on public.multimedia_vehiculos
  for all
  to authenticated
  using (true)
  with check (true);
