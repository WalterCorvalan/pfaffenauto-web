-- Finding #6 de la auditoría de seguridad (2026-09-07): las migraciones
-- sql_rls_critico_*.sql y el resto de sql_rls_*.sql agregan políticas
-- (CREATE POLICY) para varias tablas, pero ninguna corre nunca
-- "ALTER TABLE ... ENABLE ROW LEVEL SECURITY" — activar RLS se hizo a mano
-- en el dashboard de Supabase, fuera de control de versiones. Si alguien
-- recrea el ambiente desde las migraciones, o agrega una tabla nueva y se
-- olvida del paso manual, esa tabla queda abierta a la API de Supabase sin
-- que el código lo refleje en ningún lado. Mismo patrón de bug que ya causó
-- los 3 incidentes de sql_rls_critico_*.sql.
--
-- Esta migración es idempotente y solo declara lo que YA debería estar
-- vigente: activa RLS en cada tabla que tiene al menos una política propia
-- en este directorio (relevadas de todos los CREATE POLICY / DO-blocks de
-- migraciones/*.sql). No la corrí contra la base real — no tengo acceso—,
-- así que si alguna de estas tablas hoy tiene RLS desactivado, correr esto
-- la va a activar (correcto), pero si ADEMÁS le falta alguna política de
-- SELECT/INSERT/UPDATE/DELETE que hoy "andaba" solo porque RLS estaba off,
-- esa operación puntual puede empezar a devolver vacío/error — es la señal
-- de que falta escribir esa política, no de que esta migración esté mal.
--
-- IMPORTANTE — esta lista cubre solo las tablas con política conocida en
-- este repo. Puede haber otras tablas sensibles (ej. clientes, sucursales)
-- sin ninguna política versionada acá: para saber si tienen RLS activado
-- hoy, correr en el SQL editor de Supabase:
--   select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1;
-- y pedir que se sume a esta lista lo que falte.

do $$
declare
  t text;
begin
  foreach t in array array[
    -- Financiero / tesorería (sql_rls_critico_financiero.sql, sql_tesoreria_rls.sql)
    'movimientos_caja', 'cuentas', 'sueldos', 'liquidaciones_sueldo',
    'categorias_empleado', 'financiaciones', 'patentes',
    'transferencias_patentamientos', 'repuestos_reparaciones', 'gastos_varios',
    -- Identidad / permisos (sql_rls_critico_escalacion_rol.sql)
    'perfiles', 'usuario_permisos',
    -- Leads / CRM (sql_rls_restringir_edicion_ajena.sql, sql_rls_fix_reasignar_propio.sql, sql_rls_lead_wa_ig.sql)
    'cotizaciones', 'senas', 'boletos_venta',
    'whatsapp_conversaciones', 'instagram_conversaciones', 'web_chat_conversaciones',
    'tareas_lead', 'test_drives', 'eventos_lead', 'presupuestos', 'peritajes',
    -- Ventas (sql_rls_v2_ventas_comisiones.sql)
    'ventas', 'comisiones', 'venta_cuotas', 'venta_permutas', 'venta_senas',
    -- Documentación / postventa / auditoría
    'documentacion_ventas', 'documentacion_ventas_archivos',
    'postventa_casos', 'postventa_eventos', 'historial_cambios',
    'multimedia_vehiculos', 'vehiculo_proveedores', 'resp_civil',
    -- Stock (sql_rls_critico_estado_vehiculo.sql)
    'vehiculos',
    -- Ya tenían ENABLE versionado (sumadas acá por completitud/idempotencia)
    'logs_errores', 'uso_ia_openai', 'uso_ia_anthropic', 'rate_limits'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table %I enable row level security', t);
      execute format('alter table %I force row level security', t);
    end if;
  end loop;
end $$;
