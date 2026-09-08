-- Vendedor (sector "ventas") solo debe ver: Leads, WhatsApp, Tareas de
-- Leads, NPS, Rodi, Mensajes, Dormidos, Recontactos, y toda la sección
-- Comercial menos "Mis ventas". El resto del panel se apaga acá.
--
-- Se dejó "calendario" visible aunque no estaba en la lista pedida --
-- ahí vive la notificación de turnos/vencimientos que se arregló en esta
-- misma sesión, apagarlo de nuevo lo dejaría sin forma de verla. Revisar
-- si esto es lo que se quiere.
--
-- visibilidad_sector: sin fila para (modulo, sector) => visible por
-- default (ver moduloVisible() en app/panel-v2/layout.tsx), así que solo
-- hace falta insertar las filas en false para lo que se apaga.
insert into public.visibilidad_sector (modulo, sector, visible) values
  ('alertas', 'ventas', false),
  ('reportes', 'ventas', false),
  ('marketing', 'ventas', false),
  ('mi_espacio', 'ventas', false),
  ('mis_ventas', 'ventas', false),
  ('pedidos', 'ventas', false),
  ('postventa', 'ventas', false),
  ('expedientes', 'ventas', false),
  ('reclamos', 'ventas', false),
  ('gestoria', 'ventas', false),
  ('consignaciones', 'ventas', false),
  ('peritajes', 'ventas', false),
  ('infracciones', 'ventas', false),
  ('telefonos_utiles', 'ventas', false),
  ('taller', 'ventas', false),
  ('service', 'ventas', false),
  ('finanzas', 'ventas', false),
  ('cobros', 'ventas', false),
  ('tesoreria', 'ventas', false),
  ('liquidaciones', 'ventas', false),
  ('comisiones', 'ventas', false),
  ('correos', 'ventas', false),
  ('autorizaciones', 'ventas', false),
  ('sugerencias', 'ventas', false),
  ('papelera', 'ventas', false),
  ('configuracion', 'ventas', false),
  ('oportunidades', 'ventas', false),
  ('postulaciones', 'ventas', false),
  ('liquidador_sueldos', 'ventas', false),
  ('categorias_empleados', 'ventas', false),
  ('errores_sistema', 'ventas', false),
  ('logs', 'ventas', false)
on conflict (modulo, sector) do update set visible = excluded.visible;
