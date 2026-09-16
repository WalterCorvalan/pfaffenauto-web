# Cotizaciones — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Tabla principal

`public.cotizaciones` — cada fila es una cotización (oferta de venta negociable, distinta de "Presupuestos"). Campos clave:
- `precio_sugerido`: lo que propone el vendedor. `precio_aprobado`: lo que un admin terminó aprobando vía `ModificarCotizacionModal.tsx` (puede diferir del sugerido si lo negoció). **Todo consumidor tiene que preferir `precio_aprobado ?? precio_sugerido`**, nunca solo `precio_sugerido` — así lo hace el hand-off a Ventas (`VentasClient.tsx`).
- `moneda`: una sola por cotización (no hay mezcla ARS/USD como en Ventas/Señas).
- `estado`: `pendiente` → `aprobada` / `rechazada`. `historial` (array) guarda cada transición con actor y fecha.

## Componentes

- **`NuevaCotizacionModal.tsx`** — alta y edición.
- **`ModificarCotizacionModal.tsx`** — el único camino real para aprobar/rechazar/pedir info (gate de admin).
- **`CotizacionDetalleModal.tsx`** — vista rápida, con "Convertir a venta" (solo si `estado === "aprobada"`) y "Editar".
- **`CotizacionesClient.tsx`** — listado. `cambiarEstado()` es la aprobación rápida desde la lista (mismo efecto que `ModificarCotizacionModal.tsx` pero sin poder negociar el precio).

## Componentes compartidos (¡ojo al tocarlos!)

- `ClienteBuscador`-equivalente y `VehiculoSelector`-equivalente **no reusados acá** — `NuevaCotizacionModal.tsx` implementa su propia búsqueda en vivo inline (mismo patrón que `ClienteBuscador.tsx`/`VehiculoSelector.tsx`, pero sin el modo "cargar nuevo"). **Bug corregido**: antes eran `<select>` con los arrays `clientes`/`vehiculos` recibidos por prop (fetch único server-side, sin `.limit()`) — mismo bug ya corregido en Ventas/Señas/Presupuestos, un cliente o auto nuevo no aparecía hasta recargar la página, y una base grande se cortaba en 1000 filas.

## Bug corregido: editar una cotización aprobada dejaba `precio_aprobado` desactualizado

`CotizacionDetalleModal.tsx` mostraba "Editar" sin importar el estado — cualquier usuario con acceso al botón podía reabrir `NuevaCotizacionModal.tsx` sobre una cotización ya `aprobada` y cambiar precio/vehículo/permuta **sin volver a pasar por `ModificarCotizacionModal.tsx`** (el único gate real de aprobación admin). El resultado: `precio_sugerido` cambiaba pero `precio_aprobado` quedaba congelado con el valor viejo — y Ventas usa `precio_aprobado ?? precio_sugerido` para precargar la venta, así que el precio real terminaba desincronizado sin ningún indicador visible.

Arreglado en dos partes:
1. "Editar" en `CotizacionDetalleModal.tsx` ahora solo se muestra sobre una cotización `aprobada` si `soyAdmin` — igual criterio que "Eliminar".
2. `NuevaCotizacionModal.tsx`, al guardar la edición de una que **era** `aprobada`, la vuelve a `pendiente` y limpia `precio_aprobado` (agrega entrada al `historial`) — obliga a re-aprobarla en vez de dejar un precio aprobado viejo sirviendo datos nuevos.

## No tocar sin revisar el resto

- `.update(...).select().maybeSingle()`, no `.single()` — mismo patrón que Ventas/Señas: `.single()` explota con "Cannot coerce..." si RLS o un trigger bloquean releer la fila tras el `UPDATE`, tapando el error real.
- El número/id lo asigna la base — no calcular nada en el cliente.
