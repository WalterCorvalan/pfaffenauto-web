-- visibilidad_sector.sector tiene un check constraint que no conocía el
-- sector "encargado" (rol nuevo) -- por eso el insert de
-- sql_panel_v2_permisos_sector_encargado.sql y el de
-- sql_panel_v2_permisos_dashboard.sql fallaron enteros (un solo insert con
-- varias filas es atómico: si una fila viola el constraint, no entra
-- ninguna). Correr esto primero, y DESPUÉS volver a correr esos dos.
alter table public.visibilidad_sector drop constraint visibilidad_sector_sector_check;
alter table public.visibilidad_sector add constraint visibilidad_sector_sector_check
  check (sector = any (array['ventas', 'finanzas', 'gestoria', 'taller', 'recepcion', 'encargado']));
