-- BORRADO MASIVO DE DATOS DEL PANEL — pedido explícito de Walter, confirmado
-- el 2026-09-11 tras auditoría completa de Finanzas/Marketing/Web-Panel.
--
-- Qué hace: borra el CONTENIDO (las filas) de 110 tablas — todo el
-- historial de actividad del negocio (clientes, ventas, finanzas, pedidos,
-- visitas, cotizaciones, consignaciones, reclamos, chats de WhatsApp/Rodi/
-- Instagram, marketing, taller, sueldos, etc.) — sin tocar ninguna tabla ni
-- columna, sin borrar funcionalidad. Se mantienen SOLO:
--   Stock:          vehiculos, vehiculo_titulares, catalogo_config
--   Configuración:  configuracion_empresa, modulos_config,
--                   whatsapp_configuracion, whatsapp_memoria,
--                   whatsapp_plantillas, whatsapp_templates,
--                   instagram_configuracion, taller_config,
--                   taller_servicios, taller_mecanicos, sucursales,
--                   telefonos_utiles, motivos_cierre, categorias_empleado,
--                   comision_tiers, permisos_definiciones, rol_permisos,
--                   visibilidad_sector, cuentas, autorizaciones_pin
--   Usuarios/login: perfiles, usuario_permisos
--
-- El orden de los DELETE de acá abajo salió de un topological sort real
-- sobre las 300+ foreign keys del schema (no a ojo), así que respeta todas
-- las dependencias sin necesidad de CASCADE.
--
-- Todo corre en UNA transacción: si algo falla a mitad de camino, Postgres
-- deshace TODO automáticamente y la base queda intacta, exactamente como
-- estaba antes de correr esto. No hay estado intermedio "a medias".
--
-- IMPORTANTE: esto es IRREVERSIBLE si termina de commitear. No hay backup
-- automático acá.

begin;

-- ── Paso 1: soltar las 2 referencias que van de una tabla que SE MANTIENE
-- hacia una tabla que SE BORRA (si no, el DELETE de más abajo rebota por FK) ──
update public.vehiculos set mandato_id = null where mandato_id is not null;
update public.vehiculos set cliente_vinculado_id = null where cliente_vinculado_id is not null;

-- ── Paso 2: romper los 2 ciclos reales del grafo de FKs (dos tablas que se
-- referencian mutuamente, ambas se borran igual, pero hay que soltar un lado
-- del lazo primero) ──
-- ventas <-> movimientos_caja
update public.ventas set pago_efectivo_ars_movimiento_id = null where pago_efectivo_ars_movimiento_id is not null;
update public.ventas set pago_efectivo_usd_movimiento_id = null where pago_efectivo_usd_movimiento_id is not null;
update public.ventas set comprador_pago_movimiento_id = null where comprador_pago_movimiento_id is not null;
update public.ventas set pago_vendedor_movimiento_id = null where pago_vendedor_movimiento_id is not null;
update public.ventas set extra_cobrado_movimiento_id = null where extra_cobrado_movimiento_id is not null;
-- peritajes_lead <-> leads_tasacion
update public.peritajes_lead set lead_tasacion_id = null where lead_tasacion_id is not null;

-- ── Paso 3: tablas sin relaciones con ninguna otra tabla de esta lista —
-- se pueden borrar en cualquier momento/orden ──
delete from public.alertas;
delete from public.busquedas_log;
delete from public.campanas_marketing;
delete from public.chatbot_log;
delete from public.cierres_mensuales;
delete from public.disponibilidad_vendedor;
delete from public.espacio_autos_personales;
delete from public.espacio_contactos;
delete from public.espacio_cuentas_personales;
delete from public.espacio_cuotas_cobrar;
delete from public.espacio_eventos;
delete from public.espacio_gastos_fijos;
delete from public.espacio_movimientos_agencia;
delete from public.espacio_notif_prefs;
delete from public.espacio_pagos;
delete from public.espacio_pendientes;
delete from public.espacio_resumen_prefs;
delete from public.espacio_urgentes;
delete from public.espacio_whatsapp_prefs;
delete from public.eventos_calendario;
delete from public.finanzas_arqueos;
delete from public.finanzas_presupuestos;
delete from public.historial_cambios;
delete from public.infracciones;
delete from public.logs_errores;
delete from public.mandatos;
delete from public.mensajes_presencia;
delete from public.peritajes;
delete from public.postulaciones;
delete from public.premios_consignaciones;
delete from public.uso_ia_anthropic;

-- ── Paso 4: el resto, en el orden topológico exacto (hijo antes que padre) ──
delete from public.autorizaciones_pin_usos;
delete from public.autorizaciones;
delete from public.boletos;
delete from public.cheques;
delete from public.cliente_actividades;
delete from public.cliente_reasignaciones;
delete from public.comision_pagos;
delete from public.comisiones;
delete from public.consignaciones;
delete from public.consumos_tarjeta;
delete from public.cuota_pagos;
delete from public.cuotas_cobrar_clientes;
delete from public.cuotas_pagar_agencia;
delete from public.devoluciones_registro;
delete from public.espacio_cuotas_pagar;
delete from public.espacio_deudas;
delete from public.eventos_lead;
delete from public.expediente_checklist;
delete from public.expediente_documentos;
delete from public.expediente_gastos;
delete from public.expediente_hitos;
delete from public.expediente_observaciones;
delete from public.finanzas_cierres_diarios_detalle;
delete from public.finanzas_cierres_diarios;
delete from public.finanzas_recurrencias_generaciones;
delete from public.finanzas_recurrencias;
delete from public.instagram_mensajes;
delete from public.leads_tasacion;
delete from public.liquidaciones_gestoria;
delete from public.liquidaciones_sueldo;
delete from public.mensajes;
delete from public.mensajes_canal_miembros;
delete from public.mensajes_lecturas;
delete from public.mensajes_canales;
delete from public.movimiento_comprobantes;
delete from public.nps_envios;
delete from public.nps_respuestas;
delete from public.pagos_disponibles_cobros;
delete from public.pagos_disponibles;
delete from public.expedientes;
delete from public.pedidos_reconfirmaciones;
delete from public.pedidos;
delete from public.peritaje_lead_items;
delete from public.peritajes_lead;
delete from public.cotizaciones;
delete from public.postventa_recordatorios;
delete from public.postventa_compras;
delete from public.prestamos_otorgados;
delete from public.presupuesto_aperturas;
delete from public.presupuestos;
delete from public.reclamo_adjuntos;
delete from public.reclamo_seguimiento;
delete from public.reclamos;
delete from public.recontactos;
delete from public.retiros_caja;
delete from public.rodi_mensajes;
delete from public.taller_cobros;
delete from public.taller_renglones;
delete from public.taller_ordenes;
delete from public.tareas_lead;
delete from public.test_drives;
delete from public.instagram_conversaciones;
delete from public.instagram_contactos;
delete from public.leads_manuales;
delete from public.rodi_conversaciones;
delete from public.venta_cuotas;
delete from public.movimientos_caja;
delete from public.venta_estado_historial;
delete from public.venta_permutas;
delete from public.venta_recordatorios;
delete from public.venta_resenas_solicitudes;
delete from public.venta_senas;
delete from public.senas;
delete from public.ventas;
delete from public.visitas;
delete from public.whatsapp_mensajes;
delete from public.whatsapp_conversaciones;
delete from public.whatsapp_contactos;
delete from public.clientes;

commit;
