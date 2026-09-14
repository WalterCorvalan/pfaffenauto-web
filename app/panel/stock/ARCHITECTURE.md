# Stock — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Tabla principal

`public.vehiculos`. Campos clave para no confundir:

- `estado`: `disponible` / `reservado` / `señado` / `vendido` / `en_preparacion`. **Esto es lo único que mira el catálogo público** para decidir qué mostrar (filtra `in (disponible, reservado)`).
- `publicado_ml`: boolean — si el vehículo está sincronizado con **MercadoLibre**. No tiene relación con la visibilidad en el catálogo propio. El badge "% publicado" y el filtro "A revisar" del panel miden esto (aclarado con labels "en ML" desde el fix P1-17, porque antes confundía: podía decir "0% publicado" con 73 autos visibles en `/catalogo`).
- `condicion`: `0km` / `Excelente` / `Muy bueno` / `Bueno` / `Regular`. Es la fuente real de "0KM vs usado" — no derivar esto del año del vehículo (bug corregido en Señas, P1-13).
- `sucursal_id`, `radicado_localidad`, `radicado_provincia`: usados por los recibos de venta/seña para mostrar de dónde es el vehículo.
- `precio_publicado_ars` / `precio_publicado_usd`: precio que se muestra en el catálogo público — puede diferir de `precio_venta` (precio interno de referencia).

## Componentes

- **`StockClient.tsx`** — listado/tabla principal. `aRevisar(v)` = `!v.publicado_ml || v.fotos.length === 0 || !v.precio_venta` (criterio de sincronización con ML, no de "listo para vender").
- **`BotonPublicarML.tsx`** — dispara la publicación a MercadoLibre, actualiza `publicado_ml`, `ml_item_id`, `ml_publicar_error`.
- **`NuevoVehiculoModal.tsx`** / edición inline (`PrecioEditor.tsx`, `SucursalEditor.tsx`, `VendedorEditor.tsx`).
- **`NuevoMandatoModal.tsx`** — vehículos consignados (mandato), tabla `mandatos` aparte con FK a `vehiculos`.
- **`ImportarXlsxModal.tsx`** — carga masiva.

## Componente compartido usado DESDE otros módulos

- **`components/panel/VehiculoSelector.tsx`** — no vive en `stock/`, pero opera sobre la misma tabla `vehiculos` y lo usan Señas, Ventas, Presupuestos y Permutas para elegir/cargar un vehículo. Si agregás una columna nueva a `vehiculos` que otros formularios necesiten leer, decidí si va acá (afecta a los 4 consumidores) o se resuelve en cada consumidor con su propio query/join, como se hizo con `condicion` en el recibo de seña.

## Conexión con el catálogo público

- El catálogo (`app/(public)/catalogo/`) hace sus propios queries a `vehiculos` — no reusa nada de `StockClient.tsx`. Ver `app/(public)/catalogo/ARCHITECTURE.md`.
- Columnas expuestas al público: `lib/vehiculos.ts` → `CAMPOS_VEHICULO_PUBLICO`. **Nunca** usar `select("*")` en queries públicas — hay columnas internas (`precio_compra`, `precio_costo_ars/usd`, `observaciones_internas`, `vendedor_asignado_id`) que no deben viajar al cliente.

## No tocar sin revisar el resto

- No confundir `publicado_ml` con "visible en la web" en ningún indicador nuevo — son conceptos distintos y ya generó un hallazgo de auditoría por la confusión.
- `normalizarMarca()` (en `lib/vehiculos.ts`) es la utilidad compartida para deduplicar marcas por variantes de tildes/mayúsculas (usada en el home y en el filtro de marcas del catálogo) — reusarla en vez de comparar strings de marca directamente.
