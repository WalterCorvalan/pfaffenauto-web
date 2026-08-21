-- Documentación de venta hoy solo permite 1 archivo por documento (columna
-- archivo_url en documentacion_ventas) — subir uno nuevo pisa el anterior sin
-- avisar. Esta tabla nueva permite varios archivos por documento, mismo
-- patrón que ya usa postventa_adjuntos.
CREATE TABLE IF NOT EXISTS documentacion_ventas_archivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id uuid NOT NULL REFERENCES documentacion_ventas(id) ON DELETE CASCADE,
  url text NOT NULL,
  nombre_archivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documentacion_ventas_archivos_documento_id
  ON documentacion_ventas_archivos(documento_id);

-- Migramos los archivos ya cargados (el único que había por documento) a la
-- tabla nueva, para no perder nada de lo que ya se subió.
INSERT INTO documentacion_ventas_archivos (documento_id, url)
SELECT id, archivo_url FROM documentacion_ventas
WHERE archivo_url IS NOT NULL AND archivo_url <> '';
