-- Módulo de Tesorería y Financiación — fase 1 (modelo de datos).
-- Extiende movimientos_caja en vez de crear tabla paralela: así el dashboard
-- de tesorería sigue sumando saldos desde UN solo lugar. Todas las columnas
-- nuevas son nullable — los gastos/sueldos/patentes que ya se cargan hoy
-- siguen funcionando exactamente igual, quedan con estos campos en null.

alter table movimientos_caja
  add column if not exists cliente_id uuid references clientes(id),
  add column if not exists cuit_dni text,
  add column if not exists telefono text,
  add column if not exists vehiculo_id uuid references vehiculos(id),
  add column if not exists patente text,
  add column if not exists interno text,
  add column if not exists vendedor_id uuid references perfiles(id),
  add column if not exists venta_id uuid references boletos_venta(id),
  add column if not exists sena_id uuid references senas(id),
  add column if not exists destino_dinero text,
  add column if not exists es_tercero boolean not null default false,
  add column if not exists comprobante_url text,
  add column if not exists observaciones text,
  add column if not exists tipo_movimiento text, -- "Seña" | "Pago Venta" | "Pago Financiación" | null (gastos siguen usando categoria_id)
  add column if not exists estado_operacion text, -- uno de los 10 estados nuevos, solo cuando aplica
  add column if not exists aprobado boolean not null default false,
  add column if not exists aprobado_por uuid references perfiles(id),
  add column if not exists aprobado_at timestamptz;

-- Pantalla de gestoría: lista rápida de "pendientes de aprobar" sin escanear toda la tabla.
create index if not exists movimientos_caja_pendientes_aprobar_idx
  on movimientos_caja (sucursal_id, fecha)
  where aprobado = false;

-- Nota: las políticas RLS de movimientos_caja (sql_rls_critico_financiero.sql,
-- solo admin/encargado) todavía NO contemplan un vendedor cargando su propia
-- seña/pago ni un rol "gestoria" aprobando — eso se ajusta en la fase 2, junto
-- con las pantallas, cuando esté claro qué rol hace cada operación (insert vs
-- update de aprobado).
