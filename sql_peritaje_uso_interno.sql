-- Columnas nuevas en "peritajes" para la sección "Uso interno exclusivo" del
-- papel físico (estado general, público/revendedor, valor de retoma, gastos
-- de reparación/preparación, precio de venta, y quién lo aprobó) + accesorios
-- (checklist Sí/No) como JSON, ya que no encaja en el modelo categoría/ítem.

ALTER TABLE peritajes
  ADD COLUMN IF NOT EXISTS estado_general_vu text,               -- 'Bueno' | 'Regular' | 'Malo'
  ADD COLUMN IF NOT EXISTS tipo_cliente text,                    -- 'Publico' | 'Revendedor'
  ADD COLUMN IF NOT EXISTS valor_retoma numeric,
  ADD COLUMN IF NOT EXISTS gastos_reparacion numeric,
  ADD COLUMN IF NOT EXISTS gastos_preparacion numeric,
  ADD COLUMN IF NOT EXISTS precio_venta numeric,
  ADD COLUMN IF NOT EXISTS observaciones_uso_interno text,
  ADD COLUMN IF NOT EXISTS tasador text,
  ADD COLUMN IF NOT EXISTS ok_dto_vu text,
  ADD COLUMN IF NOT EXISTS ok_gerencia_ventas text,
  ADD COLUMN IF NOT EXISTS accesorios jsonb DEFAULT '{}'::jsonb;

-- Columnas nuevas en "peritaje_items" para la columna "Reparar" (check) y
-- "Gastos R." (costo estimado) que tiene cada ítem del checklist en el papel.
ALTER TABLE peritaje_items
  ADD COLUMN IF NOT EXISTS necesita_reparacion boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS gastos_reparacion numeric;
