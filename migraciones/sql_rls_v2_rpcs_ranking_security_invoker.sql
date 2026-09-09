-- Auditoría sector (2026-09-09): probado con usuario descartable sin fila
-- en perfiles (cero rol) -- las 4 funciones corren SECURITY DEFINER y
-- devuelven datos reales a cualquier autenticado:
--   ranking_ventas, tier_para_vendedor, premios_consignaciones_vendedor
--   -> leen ventas/comisiones (ya de lectura abierta a propósito, ver
--      sql_rls_v2_ventas_comisiones.sql -- reportes/ranking dependen de
--      leer ventas ajenas), así que el cambio de acá no oculta más de lo
--      que ya estaba expuesto por diseño en esas dos tablas.
--   saldos_totales_por_moneda -> lee cuentas/movimientos_caja, que SÍ
--      están restringidas a admin/encargado (sql_rls_critico_financiero.sql,
--      política "for all"). Esta es la fuga real: hoy cualquier logueado
--      sin rol ve los totales de caja de la empresa saltándose esa
--      restricción porque la función corre como dueño, no como quien
--      llama.
--
-- No tengo el cuerpo de estas funciones (sin exec_sql en este proyecto),
-- pero SECURITY INVOKER no requiere reescribirlas -- solo cambia bajo qué
-- permisos corren, igual que se hizo con las vistas de reportes
-- (sql_rls_vistas_reportes_security_invoker.sql). Con esto:
--   - saldos_totales_por_moneda pasa a respetar la RLS de cuentas/
--     movimientos_caja -> devuelve vacío/error a quien no sea admin/
--     encargado, en vez de los totales reales.
--   - las otras 3 siguen funcionando igual para todo el mundo (ventas/
--     comisiones ya eran de lectura abierta a propósito).
--
-- Si alguna rompe (por ejemplo si internamente hace algo que necesita
-- permisos de dueño, no solo lectura), el error va a ser explícito al
-- llamarla -- señal de que esa función necesita to revisarse a mano, no
-- de que esta migración esté mal.

alter function public.ranking_ventas(date, date) security invoker;
alter function public.tier_para_vendedor(uuid, date, date) security invoker;
alter function public.premios_consignaciones_vendedor(uuid, date, date) security invoker;
alter function public.saldos_totales_por_moneda() security invoker;
