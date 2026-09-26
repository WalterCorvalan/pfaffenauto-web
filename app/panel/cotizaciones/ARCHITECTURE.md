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

## Tasador de permuta — eliminado

Existió un "Tasar este usado" (`TasarUsadoModal.tsx` + `app/api/panel/tasador-mercado/route.ts` + `lib/tasadorMercado.ts`) que scrapeaba el listado público de MercadoLibre para sugerir un valor de permuta. Se sacó porque MeLi bloquea el request del server (redirige a una página de "suspicious traffic" / verificación de cuenta) — no es arreglable ajustando selectores, es un bloqueo anti-bot real. Si se quiere retomar la idea, no reintentar el scraping directo; ver git log de este archivo para la lógica vieja (incluye una v1 que usaba `vehiculos` — stock propio — como fuente, con muestra más chica pero sin depender de terceros).

## No tocar sin revisar el resto

- `.update(...).select().maybeSingle()`, no `.single()` — mismo patrón que Ventas/Señas: `.single()` explota con "Cannot coerce..." si RLS o un trigger bloquean releer la fila tras el `UPDATE`, tapando el error real.
- El número/id lo asigna la base — no calcular nada en el cliente.

## `leads_tasacion` (compra/permuta pedida desde `/cotizador`) — no es la misma tabla que `cotizaciones`

Esta pantalla (`LeadWebDetalleModal.tsx`) también muestra `leads_tasacion` (`tipo` `tasacion`/`permuta`), una tabla completamente distinta de `cotizaciones` de arriba — no hay relación entre ambas. Ver `app/panel/leads/ARCHITECTURE.md` si el contexto es leads en general.

**Pedido del 26/9**: antes `/cotizador` le calculaba al cliente una "oferta instantánea" restando un % fijo por km sobre el precio que ÉL mismo puso (`lib/panel/descuentoPorKm.ts`) — sin ningún ancla de mercado real, así que si pedía muy por encima del valor real, terminábamos ofreciendo igual demasiado caro. Se sacó esa oferta automática del formulario público entero (`CotizadorForm.tsx` ya no la calcula ni la muestra). En su lugar:
- El formulario solo junta los datos del auto + el precio que el cliente espera (`precio_esperado_cliente`), sin mostrarle ningún número calculado.
- Al recibir la cotización (`/api/panel/leads-tasacion`), se busca un precio de referencia real por web con `lib/ai/estimarPrecioMercado.ts` (usa la herramienta de búsqueda web de Claude sobre portales argentinos) y se guarda en `precio_mercado_estimado` + `precio_mercado_fuentes` (columnas de `migraciones/sql_leads_tasacion_precio_mercado.sql`). Best-effort: si la búsqueda falla o no encuentra nada, el lead se guarda igual sin ese dato — nunca bloquea el envío del formulario.
- El asesor ve los dos números (`LeadWebDetalleModal.tsx`: "Precio esperado por el cliente" vs. "Precio de mercado (web)") y decide qué ofrecerle desde el panel — **nunca se le muestra automáticamente ningún precio calculado al cliente en el sitio público**.
- `oferta_calculada`/`descuento_pct`/`acepta_oferta` quedan como campos históricos (leads de antes del 26/9 todavía los tienen) — se siguen mostrando si existen, pero ningún lead nuevo los completa.
