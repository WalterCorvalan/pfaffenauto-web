-- Nuevo rol "encargado": ve todo lo que ve un vendedor (ver
-- sql_panel_v2_permisos_sector_ventas.sql) MÁS toda la sección Operación
-- completa (pedidos, postventa, expedientes, reclamos, gestoria,
-- consignaciones, peritajes, infracciones, telefonos_utiles, taller,
-- service). El resto (Finanzas, Administración, Marketing/Reportes) sigue
-- apagado igual que para vendedor.
--
-- "encargado" es un rol nuevo -- todavía no existe en ningún perfil.
-- Asignalo desde Configuración → Equipo, seleccionando el rol "Encargado"
-- (sumado en UsuariosClient.tsx). Un perfil puede tener ["encargado",
-- "ventas"] a la vez sin problema -- la visibilidad de ambos roles se suma.
insert into public.visibilidad_sector (modulo, sector, visible) values
  ('alertas', 'encargado', false),
  ('reportes', 'encargado', false),
  ('marketing', 'encargado', false),
  ('mi_espacio', 'encargado', false),
  ('mis_ventas', 'encargado', false),
  ('finanzas', 'encargado', false),
  ('cobros', 'encargado', false),
  ('tesoreria', 'encargado', false),
  ('liquidaciones', 'encargado', false),
  ('comisiones', 'encargado', false),
  ('correos', 'encargado', false),
  ('autorizaciones', 'encargado', false),
  ('sugerencias', 'encargado', false),
  ('papelera', 'encargado', false),
  ('configuracion', 'encargado', false),
  ('oportunidades', 'encargado', false),
  ('postulaciones', 'encargado', false),
  ('liquidador_sueldos', 'encargado', false),
  ('categorias_empleados', 'encargado', false),
  ('errores_sistema', 'encargado', false),
  ('logs', 'encargado', false)
on conflict (modulo, sector) do update set visible = excluded.visible;
