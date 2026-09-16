# Financiaciones — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Tabla y origen de los datos

**No tiene tabla propia.** Vive en `public.leads_tasacion` (compartida con Cotizaciones/Peritajes), filtrando `tipo = "financiacion"`. Los otros tipos (`tasacion`, `permuta`) se listan aparte, en `/panel/cotizaciones` (solo lectura ahí, la gestión real de tasación es Peritajes — ver `cotizaciones/page.tsx`).

## Flujo completo

1. `components/forms/SolicitarFinanciacionForm.tsx` (público, home/detalle de auto) → `POST /api/panel/leads-tasacion` con `tipo: "financiacion"`.
2. La ruta valida con Zod, opcionalmente reserva una `visitas` si el cliente eligió venir a sucursal, inserta en `leads_tasacion`, y notifica a admin/encargados.
3. `page.tsx` trae todo `leads_tasacion` (sin filtrar por tipo en la query — el filtro es client-side en `FinanciacionesClient.tsx`).
4. `FinanciacionesClient.tsx` — listado con tabs por `estado` (`nuevo`/`en_gestion`/`descartado`), cambio de estado inline.
5. `FinanciacionDetalleModal.tsx` — vista rápida.

## Bug corregido: la notificación de una solicitud nueva no distinguía financiación de tasación

`app/api/panel/leads-tasacion/route.ts` insertaba directo en `alertas` (saltándose `crearAlerta()`) con `link: "/panel/cotizaciones"` **fijo**, sin importar el `tipo`. Una solicitud de financiación mandaba a admin/encargados una alerta cuyo link los llevaba a Cotizaciones, una pantalla que no tiene nada que ver — y al insertar directo en `alertas`, tampoco respetaba el módulo apagado por rol (`visibilidad_sector`) ni la categoría de notificación silenciada en Mi Espacio → Notificaciones.

Arreglado: ahora usa `crearAlerta()` con `link`/`modulo`/`titulo` que dependen de `data.tipo` (`"financiacion"` → `/panel/financiaciones`, resto → `/panel/cotizaciones`). `categoriaNotif` solo se pasa para tasación/permuta (`"cotizaciones"`) — no existe una categoría "financiaciones" en `NotificacionesTab.tsx` todavía, mismo criterio que visitas/señas en otros módulos (sin categoría en vez de forzar una que no corresponde).

## No tocar sin revisar el resto

- `.update(...).select().maybeSingle()`/`.insert(...).select().maybeSingle()`, no `.single()` — mismo patrón que el resto del panel, ya corregido acá (insert de `visitas` y de `leads_tasacion`).
- `cambiarEstado()` en `FinanciacionesClient.tsx` hace update optimista — si el guardado real falla, revierte el estado local al valor anterior (antes se quedaba mostrando el estado nuevo hasta el próximo refresh, aunque la base tuviera el viejo).
