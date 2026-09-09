-- Las vistas v_reportes_* son reportes internos (composición de ventas,
-- stock por marca, facturación de taller, etc.) -- se consumen SOLO
-- server-side desde app/panel-v2/reportes/page.tsx, siempre con sesión de
-- un usuario logueado. Pero las vistas en Postgres corren con los permisos
-- del dueño, no heredan el RLS de las tablas base solas -- así que
-- cualquiera con la anon key pública (la del bundle JS, sin login) podía
-- leerlas directo pegándole a la API REST. Vehículos/sucursales/catalogo_config
-- quedan afuera a propósito -- esos SÍ son catálogo público real.

revoke select on
  v_reportes_stock_por_marca,
  v_reportes_service_posventa,
  v_reportes_stock_por_estado,
  v_reportes_cotizaciones_resumen,
  v_reportes_expedientes_resumen,
  v_reportes_composicion_ventas,
  v_reportes_taller_facturacion,
  v_reportes_embudo_comercial,
  v_reportes_infracciones_resumen,
  v_reportes_infracciones_por_mes,
  v_reportes_ventas_por_marca,
  v_reportes_origen_leads,
  v_reportes_leads_por_utm,
  v_reportes_cotizaciones_por_estado,
  v_reportes_expedientes_por_estado,
  v_reportes_consultas_vs_ventas,
  v_reportes_clientes_por_vendedor,
  v_ventas_ponderadas,
  v_reportes_operaciones_por_vendedor,
  v_reportes_ventas_por_mes,
  v_marketing_embudo_por_canal,
  v_reportes_cotizaciones_por_vendedor,
  v_reportes_ranking_velocidad,
  v_reportes_top_clientes
from anon;
