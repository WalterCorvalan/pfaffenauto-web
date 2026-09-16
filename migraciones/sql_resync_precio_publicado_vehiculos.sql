-- Reparación de datos: 3 lugares del panel (PrecioEditor.tsx, edición
-- rápida de precio desde el listado; ImportarXlsxModal.tsx, carga masiva
-- por Excel; NuevoMandatoModal.tsx, alta de vehículo desde un mandato)
-- escribían precio_venta/moneda_venta sin sincronizar
-- precio_publicado_ars/usd -- el catálogo público y el simulador de
-- financiación leen SOLO estos dos últimos campos, nunca precio_venta
-- directo (criterio documentado en ventas/ARCHITECTURE.md: "siempre se
-- publica el mismo precio de venta interno, sin override manual").
--
-- Resultado real: vehículos con precio cargado y visible en el panel
-- (precio_venta) pero sin precio o con un precio viejo en la web
-- (precio_publicado_ars/usd desincronizado o nunca seteado) -- caso
-- reportado por el usuario con una Volkswagen Tiguan.
--
-- Corrige el código hacia adelante (PR ya mergeado) y sincroniza los datos
-- existentes acá: para todo vehículo cuyo precio_publicado_* no coincida
-- con precio_venta/moneda_venta, lo pisa. Coherente con el criterio de
-- "siempre igual a precio_venta, sin override manual" ya establecido --
-- no hay pérdida de ninguna decisión manual real, porque esa decisión
-- nunca existió como feature en el panel.
update public.vehiculos
set
  precio_publicado_ars = case when moneda_venta = 'ARS' then precio_venta else null end,
  precio_publicado_usd = case when moneda_venta = 'USD' then precio_venta else null end
where
  precio_publicado_ars is distinct from (case when moneda_venta = 'ARS' then precio_venta else null end)
  or precio_publicado_usd is distinct from (case when moneda_venta = 'USD' then precio_venta else null end);
