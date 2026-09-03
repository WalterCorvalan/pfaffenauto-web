-- Fix: v_reportes_infracciones_por_mes quedó con SECURITY DEFINER por
-- default (heredado del creador) — como el resto de las vistas de
-- reportes, corre con los permisos de quien consulta, no del creador.
alter view public.v_reportes_infracciones_por_mes set (security_invoker = true);
