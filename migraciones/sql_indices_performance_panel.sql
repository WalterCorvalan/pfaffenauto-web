-- Índices para acelerar el panel. Postgres NO indexa automáticamente las
-- columnas de foreign key -- cada .eq("vendedor_id", ...) / .eq("cliente_id", ...)
-- / .eq("destinatario_id", ...) que el panel hace constantemente termina en un
-- seq scan sobre toda la tabla sin esto, y varias de estas tablas ya tienen
-- miles de filas (ventas, clientes, vehiculos, whatsapp_mensajes, alertas).
--
-- Todo con "if not exists" -- correr una sola vez, es seguro re-correr si
-- alguno ya existiera. No bloquea escrituras largo tiempo salvo que las
-- tablas sean gigantes; si alguna tabla ya es muy grande y esto tarda, se
-- puede recrear puntualmente con CONCURRENTLY (no lo uso acá porque
-- CREATE INDEX CONCURRENTLY no puede ir dentro de una transacción / un solo
-- statement del editor SQL de Supabase a veces lo envuelve en una).

-- ── Alertas: destinatario_id se filtra en cada carga de NotificationBell/toast ──
create index if not exists idx_alertas_destinatario_leida on public.alertas (destinatario_id, leida);
create index if not exists idx_alertas_created_at on public.alertas (created_at desc);

-- ── Clientes: cartera por vendedor, orden por fecha ──
create index if not exists idx_clientes_vendedor_id on public.clientes (vendedor_id);
create index if not exists idx_clientes_created_at on public.clientes (created_at desc);
create index if not exists idx_clientes_dni_cuit on public.clientes (dni_cuit);

-- ── Vehículos: Stock filtra por estado constantemente, catálogo público por estado+condicion ──
create index if not exists idx_vehiculos_estado on public.vehiculos (estado);
create index if not exists idx_vehiculos_sucursal_id on public.vehiculos (sucursal_id);
create index if not exists idx_vehiculos_vendedor_asignado_id on public.vehiculos (vendedor_asignado_id);
create index if not exists idx_vehiculos_created_at on public.vehiculos (created_at desc);

-- ── Ventas: la tabla más consultada de Finanzas/Tesorería/Liquidaciones/Comisiones ──
create index if not exists idx_ventas_vendedor_id on public.ventas (vendedor_id);
create index if not exists idx_ventas_cliente_id on public.ventas (cliente_id);
create index if not exists idx_ventas_vehiculo_id on public.ventas (vehiculo_id);
create index if not exists idx_ventas_estado on public.ventas (estado);
create index if not exists idx_ventas_fecha_cierre on public.ventas (fecha_cierre desc);
create index if not exists idx_ventas_comprador_dni on public.ventas (comprador_dni);

-- ── Expedientes: filtro por gestor (además de la política RLS que lo usa) ──
create index if not exists idx_expedientes_gestor_asignado_id on public.expedientes (gestor_asignado_id);
create index if not exists idx_expedientes_estado on public.expedientes (estado);

-- ── Conversaciones (WhatsApp/Instagram/Rodi): bandeja por vendedor + orden por último mensaje ──
create index if not exists idx_wa_conv_vendedor_id on public.whatsapp_conversaciones (vendedor_id);
create index if not exists idx_wa_conv_cliente_id on public.whatsapp_conversaciones (cliente_id);
create index if not exists idx_wa_conv_last_message_at on public.whatsapp_conversaciones (last_message_at desc);
create index if not exists idx_wa_mensajes_conversacion_id on public.whatsapp_mensajes (conversacion_id, created_at);

create index if not exists idx_ig_conv_vendedor_id on public.instagram_conversaciones (vendedor_id);
create index if not exists idx_ig_conv_last_message_at on public.instagram_conversaciones (last_message_at desc);
create index if not exists idx_ig_mensajes_conversacion_id on public.instagram_mensajes (conversacion_id, created_at);

create index if not exists idx_rodi_conv_vendedor_id on public.rodi_conversaciones (vendedor_id);
create index if not exists idx_rodi_conv_last_message_at on public.rodi_conversaciones (last_message_at desc);
create index if not exists idx_rodi_mensajes_conversacion_id on public.rodi_mensajes (conversacion_id, created_at);

-- ── Comisiones: Mis Comisiones filtra por beneficiario constantemente ──
create index if not exists idx_comisiones_beneficiario_id on public.comisiones (beneficiario_id);
create index if not exists idx_comisiones_venta_id on public.comisiones (venta_id);
create index if not exists idx_comisiones_estado on public.comisiones (estado);

-- ── Señas, Cotizaciones, Presupuestos, Pedidos, Consignaciones: mismo patrón, por vendedor ──
create index if not exists idx_senas_vendedor_id on public.senas (vendedor_id);
create index if not exists idx_senas_vehiculo_id on public.senas (vehiculo_id);
create index if not exists idx_cotizaciones_vendedor_id on public.cotizaciones (vendedor_id);
create index if not exists idx_cotizaciones_cliente_id on public.cotizaciones (cliente_id);
create index if not exists idx_presupuestos_vendedor_id on public.presupuestos (vendedor_id);
create index if not exists idx_pedidos_vendedor_id on public.pedidos (vendedor_id);
create index if not exists idx_pedidos_cliente_id on public.pedidos (cliente_id);
create index if not exists idx_consignaciones_vendedor_id on public.consignaciones (vendedor_id);

-- ── Movimientos de caja / Finanzas: la pantalla más pesada de filtrar por fecha+cuenta ──
create index if not exists idx_movimientos_caja_cuenta_id on public.movimientos_caja (cuenta_id);
create index if not exists idx_movimientos_caja_fecha on public.movimientos_caja (fecha desc);
create index if not exists idx_movimientos_caja_venta_id on public.movimientos_caja (venta_id);
create index if not exists idx_movimientos_caja_deleted_at on public.movimientos_caja (deleted_at) where deleted_at is null;

-- ── Mensajería interna (Mensajes) ──
create index if not exists idx_mensajes_canal_id on public.mensajes (canal_id, created_at);

-- ── Tareas/eventos de lead, usados en Leads y en los crons de recordatorios ──
create index if not exists idx_tareas_lead_wa_conv on public.tareas_lead (whatsapp_conversacion_id);
create index if not exists idx_tareas_lead_completada_venc on public.tareas_lead (completada, fecha_vencimiento);
