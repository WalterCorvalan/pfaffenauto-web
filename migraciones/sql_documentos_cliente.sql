-- Documentación que el cliente sube desde /seguimiento (foto/PDF del auto
-- que entrega en parte de pago, DNI, cédula verde, etc.), buscando por su
-- código de seguimiento. Se engancha a "senas" si todavía no hay venta
-- cerrada (el expediente recién se crea al cerrar la venta), o a "ventas"
-- si ya la hay -- exactamente uno de los dos, nunca ambos.
CREATE TABLE IF NOT EXISTS documentos_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_seguimiento text NOT NULL,
  venta_id uuid REFERENCES ventas(id) ON DELETE CASCADE,
  sena_id uuid REFERENCES senas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT documentos_cliente_un_solo_vinculo CHECK (
    (venta_id IS NOT NULL AND sena_id IS NULL) OR (venta_id IS NULL AND sena_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS documentos_cliente_codigo_idx ON documentos_cliente (codigo_seguimiento);
CREATE INDEX IF NOT EXISTS documentos_cliente_venta_idx ON documentos_cliente (venta_id);
CREATE INDEX IF NOT EXISTS documentos_cliente_sena_idx ON documentos_cliente (sena_id);

ALTER TABLE documentos_cliente ENABLE ROW LEVEL SECURITY;

-- Sin política de INSERT/SELECT para "anon": el alta desde /seguimiento y
-- la lectura pública en esa misma página pasan siempre por rutas server-side
-- con la service role key (que ignora RLS), nunca con la anon key desde el
-- browser -- así el listado de documentos de un cliente no queda expuesto
-- por REST/Supabase JS a cualquiera que adivine el código de otro.
CREATE POLICY "documentos_cliente_staff_administra" ON documentos_cliente
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
