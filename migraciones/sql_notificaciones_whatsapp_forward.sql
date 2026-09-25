-- Reenvío de notificaciones al WhatsApp personal del vendedor (Opción 2
-- charlada con el usuario: para vendedores que no entran seguido al CRM,
-- cada alerta que le crearía la campanita también se le manda como mensaje
-- de WhatsApp a su número personal, reusando el mismo número/token de
-- WhatsApp Business ya conectado para el bot de clientes). Opt-in: solo se
-- reenvía a quien activó "whatsapp_forward" en Mi Espacio → Notificaciones
-- Y tiene cargado un número en perfiles.whatsapp (Configuración → Usuarios).

ALTER TABLE alertas ADD COLUMN IF NOT EXISTS whatsapp_enviado boolean NOT NULL DEFAULT false;

-- Índice parcial: el cron solo pregunta por las que faltan reenviar, no
-- escanea toda la tabla en cada corrida.
CREATE INDEX IF NOT EXISTS alertas_whatsapp_pendientes_idx ON alertas (created_at) WHERE whatsapp_enviado = false;

ALTER TABLE espacio_notif_prefs ADD COLUMN IF NOT EXISTS whatsapp_forward boolean NOT NULL DEFAULT false;
