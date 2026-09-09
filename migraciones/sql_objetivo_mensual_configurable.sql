-- Objetivo mensual (Cockpit CEO): hoy no existía ninguna columna para
-- cargarlo -- el propio código lo decía ("Objetivos configurables...
-- quedan para una próxima tanda", CockpitCeoTab.tsx). Cantidad de autos a
-- vender en el mes, editable en Configuración → Empresa.

alter table public.configuracion_empresa add column if not exists objetivo_ventas_mensual int4;
