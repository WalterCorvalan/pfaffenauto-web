-- Habilita los recordatorios de "Mi Espacio" para cuotas a cobrar/pagar y
-- gastos fijos (antes se cargaban pero nunca avisaban nada).
ALTER TABLE espacio_cuotas_cobrar ADD COLUMN IF NOT EXISTS aviso_enviado boolean NOT NULL DEFAULT false;
ALTER TABLE espacio_cuotas_pagar ADD COLUMN IF NOT EXISTS aviso_enviado boolean NOT NULL DEFAULT false;
ALTER TABLE espacio_gastos_fijos ADD COLUMN IF NOT EXISTS ultimo_aviso_mes text;
