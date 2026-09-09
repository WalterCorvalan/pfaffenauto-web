-- Causa raíz del hallazgo del linter de Supabase ("Security Definer View"):
-- estas vistas corren con los permisos de quien las CREÓ (bypassea RLS por
-- completo), no con los del usuario que las consulta. El REVOKE a "anon" de
-- la migración anterior tapaba el síntoma para gente sin login -- esto
-- arregla la causa: con security_invoker, la vista respeta el RLS/rol de
-- quien pregunta, sea anon, un vendedor o un admin.

alter view v_reportes_ventas_por_marca set (security_invoker = on);
alter view v_reportes_stock_por_marca set (security_invoker = on);
alter view v_reportes_origen_leads set (security_invoker = on);
alter view v_reportes_service_posventa set (security_invoker = on);
alter view v_reportes_stock_por_estado set (security_invoker = on);
alter view v_reportes_leads_por_utm set (security_invoker = on);
alter view v_reportes_cotizaciones_por_estado set (security_invoker = on);
alter view v_reportes_expedientes_por_estado set (security_invoker = on);
alter view v_reportes_consultas_vs_ventas set (security_invoker = on);
alter view v_reportes_clientes_por_vendedor set (security_invoker = on);
alter view v_ventas_ponderadas set (security_invoker = on);
alter view v_reportes_operaciones_por_vendedor set (security_invoker = on);
alter view v_reportes_ventas_por_mes set (security_invoker = on);
alter view v_marketing_embudo_por_canal set (security_invoker = on);
alter view v_reportes_cotizaciones_por_vendedor set (security_invoker = on);
alter view v_reportes_cotizaciones_resumen set (security_invoker = on);
alter view v_reportes_ranking_velocidad set (security_invoker = on);
alter view v_reportes_top_clientes set (security_invoker = on);
alter view v_reportes_expedientes_resumen set (security_invoker = on);
alter view v_reportes_composicion_ventas set (security_invoker = on);
alter view v_reportes_taller_facturacion set (security_invoker = on);
alter view v_reportes_embudo_comercial set (security_invoker = on);
alter view v_reportes_infracciones_resumen set (security_invoker = on);
alter view v_reportes_infracciones_por_mes set (security_invoker = on);
