-- Diagrama interactivo de carrocería: marcas por zona (puerta, guardabarros,
-- capot, etc.) con su símbolo (rayado / elemento a cambiar / pintura quemada /
-- pintura cuarteada), igual que el diagrama del papel. Se guarda como jsonb
-- {"vista:zona": "rayado" | "cambiar" | "quemada" | "cuarteada"}.
ALTER TABLE peritajes
  ADD COLUMN IF NOT EXISTS carroceria_marcas jsonb DEFAULT '{}'::jsonb;
