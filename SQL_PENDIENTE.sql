-- CRM/Leads: vendedor asignado, vehículo vinculado, tareas de seguimiento, motivo de cierre.
-- Idempotente: usa IF NOT EXISTS donde aplica.

ALTER TABLE public.cotizaciones ADD COLUMN IF NOT EXISTS vendedor_id uuid REFERENCES public.perfiles(id);
ALTER TABLE public.cotizaciones ADD COLUMN IF NOT EXISTS vehiculo_id uuid REFERENCES public.vehiculos(id);
ALTER TABLE public.cotizaciones ADD COLUMN IF NOT EXISTS motivo_cierre_id uuid;

CREATE TABLE IF NOT EXISTS public.motivos_cierre (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cotizaciones_motivo_cierre_fk'
  ) THEN
    ALTER TABLE public.cotizaciones ADD CONSTRAINT cotizaciones_motivo_cierre_fk FOREIGN KEY (motivo_cierre_id) REFERENCES public.motivos_cierre(id);
  END IF;
END $$;

DROP POLICY IF EXISTS "Staff gestiona motivos_cierre" ON public.motivos_cierre;
CREATE POLICY "Staff gestiona motivos_cierre" ON public.motivos_cierre FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.motivos_cierre (nombre)
SELECT nombre FROM (VALUES
  ('No contesta'), ('Precio muy alto'), ('Compró en otra agencia'), ('Ya no le interesa'), ('Financiación no aprobada')
) AS v(nombre)
WHERE NOT EXISTS (SELECT 1 FROM public.motivos_cierre);

CREATE TABLE IF NOT EXISTS public.tareas_lead (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id uuid NOT NULL REFERENCES public.cotizaciones(id),
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['Llamar','Enviar Email','Enviar SMS','Enviar WhatsApp','Visitar al Cliente','Cliente visita salón'])),
  titulo text,
  fecha_vencimiento timestamptz NOT NULL,
  completada boolean NOT NULL DEFAULT false,
  creado_por uuid REFERENCES public.perfiles(id),
  created_at timestamptz DEFAULT now()
);

DROP POLICY IF EXISTS "Staff gestiona tareas_lead" ON public.tareas_lead;
CREATE POLICY "Staff gestiona tareas_lead" ON public.tareas_lead FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ampliación: prospecto (domicilio/notas), eventos (timeline), test drive, pedir asistencia.
ALTER TABLE public.cotizaciones ADD COLUMN IF NOT EXISTS domicilio text;
ALTER TABLE public.cotizaciones ADD COLUMN IF NOT EXISTS notas text;
ALTER TABLE public.cotizaciones ADD COLUMN IF NOT EXISTS asistencia_solicitada boolean NOT NULL DEFAULT false;
ALTER TABLE public.cotizaciones ADD COLUMN IF NOT EXISTS asistencia_nota text;
ALTER TABLE public.cotizaciones ADD COLUMN IF NOT EXISTS asistencia_atendida boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.eventos_lead (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id uuid NOT NULL REFERENCES public.cotizaciones(id),
  tipo text NOT NULL,
  descripcion text NOT NULL,
  creado_por uuid REFERENCES public.perfiles(id),
  created_at timestamptz DEFAULT now()
);
DROP POLICY IF EXISTS "Staff gestiona eventos_lead" ON public.eventos_lead;
CREATE POLICY "Staff gestiona eventos_lead" ON public.eventos_lead FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.test_drives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id uuid NOT NULL REFERENCES public.cotizaciones(id),
  vehiculo_id uuid REFERENCES public.vehiculos(id),
  fecha_hora timestamptz NOT NULL,
  estado text NOT NULL DEFAULT 'Programado' CHECK (estado = ANY (ARRAY['Programado','Realizado','Cancelado'])),
  notas text,
  created_at timestamptz DEFAULT now()
);
DROP POLICY IF EXISTS "Staff gestiona test_drives" ON public.test_drives;
CREATE POLICY "Staff gestiona test_drives" ON public.test_drives FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Asistencia dirigida a una persona puntual (no solo "el encargado" genérico).
ALTER TABLE public.cotizaciones ADD COLUMN IF NOT EXISTS asistencia_para uuid REFERENCES public.perfiles(id);

-- Se reemplaza el tablero genérico de Tareas del Equipo por tareas_lead (por lead,
-- con fecha/tipo). No puede haber 2 tablas de tareas — se borra la vieja.
DROP TABLE IF EXISTS public.tareas CASCADE;

-- Permisos de rol "vendedor": la policy "Staff gestiona vehiculos" (FOR ALL, USING true)
-- le gana por OR a la policy restrictiva de admin/encargado y deja a cualquier
-- autenticado editar cualquier campo de vehiculos a nivel de base. Se achica a solo
-- SELECT (ver stock completo sigue abierto a todos); el INSERT/UPDATE/DELETE real queda
-- en manos de las policies de admin/encargado que ya existían.
DROP POLICY IF EXISTS "Staff gestiona vehiculos" ON public.vehiculos;
DROP POLICY IF EXISTS "Staff ve vehiculos" ON public.vehiculos;
CREATE POLICY "Staff ve vehiculos" ON public.vehiculos FOR SELECT TO authenticated USING (true);

-- Verificación de documentación: quién la hizo (agencia o cliente/gestor externo).
ALTER TABLE public.documentacion_ventas ADD COLUMN IF NOT EXISTS verificado_por text CHECK (verificado_por = ANY (ARRAY['Agencia','Cliente']));

-- Link público de presupuestos + tracking de apertura + notificaciones in-app.
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS token_publico text UNIQUE;

CREATE TABLE IF NOT EXISTS public.presupuesto_aperturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid NOT NULL REFERENCES public.presupuestos(id),
  created_at timestamptz DEFAULT now()
);
DROP POLICY IF EXISTS "Staff ve aperturas" ON public.presupuesto_aperturas;
CREATE POLICY "Staff ve aperturas" ON public.presupuesto_aperturas FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id uuid NOT NULL REFERENCES public.perfiles(id),
  tipo text NOT NULL,
  mensaje text NOT NULL,
  link text,
  leida boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
DROP POLICY IF EXISTS "Cada uno ve sus notificaciones" ON public.notificaciones;
CREATE POLICY "Cada uno ve sus notificaciones" ON public.notificaciones FOR SELECT TO authenticated USING (perfil_id = auth.uid());
DROP POLICY IF EXISTS "Cada uno marca sus notificaciones" ON public.notificaciones;
CREATE POLICY "Cada uno marca sus notificaciones" ON public.notificaciones FOR UPDATE TO authenticated USING (perfil_id = auth.uid());

-- Habilita Realtime (postgres_changes) sobre notificaciones para que la campanita
-- se actualice en vivo sin recargar la página.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notificaciones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones;
  END IF;
END $$;

-- Detección instantánea de auto por Meta Ads (referral) en el bot de WhatsApp.
ALTER TABLE public.whatsapp_conversaciones ADD COLUMN IF NOT EXISTS origen_ads text;

-- Sistema de permisos dinámicos (por rol + excepción por usuario).
CREATE TABLE IF NOT EXISTS public.permisos_definiciones (
  clave text PRIMARY KEY, nombre text NOT NULL, descripcion text, categoria text NOT NULL DEFAULT 'General'
);
INSERT INTO public.permisos_definiciones (clave, nombre, descripcion, categoria) VALUES
  ('vehiculos.crear', 'Crear vehículo nuevo', 'Dar de alta un auto nuevo en el stock', 'Stock'),
  ('vehiculos.editar_completo', 'Editar ficha completa del vehículo', 'Editar specs, precios y datos legales (no solo fotos)', 'Stock'),
  ('vehiculos.ver_costo', 'Ver precio de costo', 'Ver el precio de costo oculto del vehículo', 'Stock')
ON CONFLICT (clave) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.rol_permisos (
  rol text NOT NULL, permiso_clave text NOT NULL REFERENCES public.permisos_definiciones(clave),
  otorgado boolean NOT NULL DEFAULT false, PRIMARY KEY (rol, permiso_clave)
);
INSERT INTO public.rol_permisos (rol, permiso_clave, otorgado)
  SELECT r, p.clave, (r IN ('admin','encargado'))
  FROM unnest(ARRAY['admin','encargado','vendedor','taller']) r, public.permisos_definiciones p
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.usuario_permisos (
  perfil_id uuid NOT NULL REFERENCES public.perfiles(id), permiso_clave text NOT NULL REFERENCES public.permisos_definiciones(clave),
  otorgado boolean NOT NULL, PRIMARY KEY (perfil_id, permiso_clave)
);

-- Excepción por usuario pisa el default del rol; si no hay excepción, se usa el rol; admin siempre true (nunca se puede auto-bloquear).
CREATE OR REPLACE FUNCTION public.tiene_permiso(uid uuid, clave_permiso text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN (SELECT rol FROM perfiles WHERE id = uid) = 'admin' THEN true ELSE COALESCE(
    (SELECT otorgado FROM usuario_permisos WHERE perfil_id = uid AND permiso_clave = clave_permiso),
    (SELECT otorgado FROM rol_permisos WHERE rol = (SELECT rol FROM perfiles WHERE id = uid) AND permiso_clave = clave_permiso),
    false
  ) END;
$$;

ALTER TABLE public.permisos_definiciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rol_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_permisos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff lee catalogo permisos" ON public.permisos_definiciones;
CREATE POLICY "Staff lee catalogo permisos" ON public.permisos_definiciones FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff lee rol_permisos" ON public.rol_permisos;
CREATE POLICY "Staff lee rol_permisos" ON public.rol_permisos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff lee usuario_permisos" ON public.usuario_permisos;
CREATE POLICY "Staff lee usuario_permisos" ON public.usuario_permisos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin escribe rol_permisos" ON public.rol_permisos;
CREATE POLICY "Admin escribe rol_permisos" ON public.rol_permisos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));
DROP POLICY IF EXISTS "Admin escribe usuario_permisos" ON public.usuario_permisos;
CREATE POLICY "Admin escribe usuario_permisos" ON public.usuario_permisos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));

-- Policies aditivas sobre vehiculos (no tocan/reemplazan las existentes de admin/encargado).
DROP POLICY IF EXISTS "Permiso dinamico crea vehiculos" ON public.vehiculos;
CREATE POLICY "Permiso dinamico crea vehiculos" ON public.vehiculos FOR INSERT TO authenticated
  WITH CHECK (public.tiene_permiso(auth.uid(), 'vehiculos.crear'));
DROP POLICY IF EXISTS "Permiso dinamico edita vehiculos" ON public.vehiculos;
CREATE POLICY "Permiso dinamico edita vehiculos" ON public.vehiculos FOR UPDATE TO authenticated
  USING (public.tiene_permiso(auth.uid(), 'vehiculos.editar_completo'))
  WITH CHECK (public.tiene_permiso(auth.uid(), 'vehiculos.editar_completo'));

-- Confirmación de precio al generar seña/venta/presupuesto: si el vendedor no está
-- seguro, queda marcado y se notifica a los encargados.
ALTER TABLE public.senas ADD COLUMN IF NOT EXISTS precio_confirmado boolean NOT NULL DEFAULT true;
ALTER TABLE public.boletos_venta ADD COLUMN IF NOT EXISTS precio_confirmado boolean NOT NULL DEFAULT true;
ALTER TABLE public.presupuestos ADD COLUMN IF NOT EXISTS precio_confirmado boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "Staff notifica a otros" ON public.notificaciones;
CREATE POLICY "Staff notifica a otros" ON public.notificaciones FOR INSERT TO authenticated WITH CHECK (true);

-- Boleto de Venta: carga manual de auto → stock real (incompleto), y Forma de Pago
-- (efectivo + permuta + remanente financiado por la agencia).
ALTER TABLE public.vehiculos DROP CONSTRAINT IF EXISTS vehiculos_estado_check;
ALTER TABLE public.vehiculos ADD CONSTRAINT vehiculos_estado_check
  CHECK (estado = ANY (ARRAY['Disponible','Reservado','Vendido','Archivado','Incompleto']));

ALTER TABLE public.boletos_venta ADD COLUMN IF NOT EXISTS efectivo_ars numeric;
ALTER TABLE public.boletos_venta ADD COLUMN IF NOT EXISTS efectivo_usd numeric;
ALTER TABLE public.boletos_venta ADD COLUMN IF NOT EXISTS permuta_vehiculo_id uuid REFERENCES public.vehiculos(id);
ALTER TABLE public.boletos_venta ADD COLUMN IF NOT EXISTS permuta_tasado_ars numeric;
ALTER TABLE public.boletos_venta ADD COLUMN IF NOT EXISTS remanente_ars numeric;
ALTER TABLE public.boletos_venta ADD COLUMN IF NOT EXISTS fecha_primera_cuota_remanente date;
ALTER TABLE public.boletos_venta ADD COLUMN IF NOT EXISTS cant_cuotas_remanente int;
ALTER TABLE public.boletos_venta ADD COLUMN IF NOT EXISTS cuota_remanente_ars numeric;

-- Ficha de vehículo: legales, proveedor, titulares y datos comerciales.
ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS marca_motor text;
ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS marca_chasis text;
ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS ubicacion text;
ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS fecha_compra date;
ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS sucursal_compra_id uuid REFERENCES public.sucursales(id);
ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS importe_patente_anual numeric;

CREATE TABLE IF NOT EXISTS public.vehiculo_proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_id uuid NOT NULL UNIQUE REFERENCES public.vehiculos(id),
  nombre text, apellido text, dni text, fecha_nacimiento date, cuit_cuil text,
  calle text, numero text, depto text, localidad text, codigo_postal text, provincia text,
  telefono_linea text, telefono_celular text, email text,
  created_at timestamptz DEFAULT now()
);
DROP POLICY IF EXISTS "Staff gestiona proveedores vehiculo" ON public.vehiculo_proveedores;
CREATE POLICY "Staff gestiona proveedores vehiculo" ON public.vehiculo_proveedores FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.vehiculo_titulares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_id uuid NOT NULL REFERENCES public.vehiculos(id),
  orden int NOT NULL DEFAULT 1,
  nombre text, porcentaje numeric, cuit_cuil text,
  created_at timestamptz DEFAULT now()
);
DROP POLICY IF EXISTS "Staff gestiona titulares vehiculo" ON public.vehiculo_titulares;
CREATE POLICY "Staff gestiona titulares vehiculo" ON public.vehiculo_titulares FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Integración MercadoLibre: publicar/sincronizar autos automáticamente vía su API (OAuth2).
-- Tokens se guardan encriptados (lib/crypto, AES-256-GCM) — nunca en texto plano.
CREATE TABLE IF NOT EXISTS public.mercadolibre_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ml_user_id text NOT NULL,
  access_token_cipher text NOT NULL,
  access_token_iv text NOT NULL,
  access_token_tag text NOT NULL,
  refresh_token_cipher text NOT NULL,
  refresh_token_iv text NOT NULL,
  refresh_token_tag text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.mercadolibre_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Solo admin gestiona config mercadolibre" ON public.mercadolibre_config;
CREATE POLICY "Solo admin gestiona config mercadolibre" ON public.mercadolibre_config FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));

-- Estado de publicación por vehículo. ml_estado: no_publicado | publicado | pausado | error.
ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS ml_item_id text;
ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS ml_estado text NOT NULL DEFAULT 'no_publicado';
ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS ml_publicado_at timestamptz;
ALTER TABLE public.vehiculos ADD COLUMN IF NOT EXISTS ml_error text;

-- Canal Web Chat: mismo agente de IA que WhatsApp, pero para el widget del sitio público.
-- Tablas nuevas y aditivas, no tocan whatsapp_conversaciones/whatsapp_mensajes.
CREATE TABLE IF NOT EXISTS public.web_chat_conversaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  nombre text,
  telefono text,
  estado_pipeline text NOT NULL DEFAULT 'Nuevo',
  calificacion text,
  vehiculo_id uuid REFERENCES public.vehiculos(id),
  vendedor_id uuid REFERENCES public.perfiles(id),
  handoff_at timestamptz,
  handoff_reason text,
  ai_habilitada boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.web_chat_mensajes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id uuid NOT NULL REFERENCES public.web_chat_conversaciones(id),
  direccion text NOT NULL CHECK (direccion = ANY (ARRAY['in','out'])),
  texto text NOT NULL,
  ai_generado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.web_chat_conversaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_chat_mensajes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff ve y gestiona web_chat_conversaciones" ON public.web_chat_conversaciones;
CREATE POLICY "Staff ve y gestiona web_chat_conversaciones" ON public.web_chat_conversaciones FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Staff ve y gestiona web_chat_mensajes" ON public.web_chat_mensajes;
CREATE POLICY "Staff ve y gestiona web_chat_mensajes" ON public.web_chat_mensajes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sin policy pública de insert: el widget escribe siempre a través de /api/webchat
-- con la service role key, nunca directo desde el navegador.
