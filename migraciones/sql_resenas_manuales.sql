-- Reseñas de Google cargadas a mano (sin API/credenciales de Google Places).
-- Se pegan manualmente desde el panel; la web las muestra rotando y linkea
-- a Google Maps para quien quiera ver todas o dejar la suya.
CREATE TABLE IF NOT EXISTS resenas_manuales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  texto text NOT NULL,
  rating int NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  fecha_texto text, -- ej: "Hace 2 semanas" (tal cual como aparece en Google)
  activo boolean NOT NULL DEFAULT true,
  orden int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE resenas_manuales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resenas_manuales_lectura_publica" ON resenas_manuales
  FOR SELECT USING (activo = true);

CREATE POLICY "resenas_manuales_staff_administra" ON resenas_manuales
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
