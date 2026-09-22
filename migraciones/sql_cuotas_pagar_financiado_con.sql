ALTER TABLE cuotas_pagar_agencia ADD COLUMN IF NOT EXISTS financiado_con_cuota_cobrar_id uuid REFERENCES cuotas_cobrar_clientes(id) ON DELETE SET NULL;
