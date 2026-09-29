-- Contenido de "Entregas" (historias/posteos de Instagram, cortitos) que se
-- muestra en la home pública (VentasRealizadas.tsx / MediaReel) -- antes era
-- un array hardcodeado en el componente con fotos de stock de Unsplash.
-- Se carga a mano desde Panel → Marketing → Entregas.
CREATE TABLE IF NOT EXISTS entregas_realizadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL DEFAULT 'foto' CHECK (tipo IN ('foto', 'video')),
  src text NOT NULL,
  titulo text NOT NULL,
  link text,
  orden int NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE entregas_realizadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entregas_realizadas_lectura_publica" ON entregas_realizadas
  FOR SELECT USING (activo = true);

CREATE POLICY "entregas_realizadas_staff_administra" ON entregas_realizadas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
