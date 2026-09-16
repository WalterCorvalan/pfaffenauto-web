# Presupuestos — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Tabla principal

`public.presupuestos` — cada fila es un presupuesto. Campos clave:
- `precio_ars` / `precio_usd` (mutuamente excluyentes, ver inputs `disabled` cruzados en `NuevoPresupuestoModal.tsx`): precio cotizado, en una sola moneda. No hay conversión entre ambos ni suma — nunca aparecen los dos a la vez para el mismo presupuesto.
- `precio_confirmado`: si el vendedor confirmó el precio con el cliente antes de imprimir. Si no, se notifica a encargados (`notificarEncargados`, `categoriaNotif: "taller"`).
- `token_publico`: código para el link de `CompartirPresupuestoBoton.tsx` (WhatsApp) y la página pública `imprimir/[id]`.

## Componentes

- **`NuevoPresupuestoModal.tsx`** — alta. Precarga precio desde el vehículo elegido con fallback `precio_publicado_* → precio_venta` (la mayoría del stock solo tiene `precio_venta` cargado).
- **`PresupuestosClient.tsx`** — listado.
- **`PresupuestoDetalleModal.tsx`** — vista rápida.
- **`imprimir/[id]/page.tsx` + `ImprimirPresupuesto.tsx`** — documento imprimible/compartible, con botón "Confirmar precio" (`confirmarPrecio`) que actualiza `precio_confirmado` in situ.
- **`CompartirPresupuestoBoton.tsx`** — arma el link público con `token_publico`.

## Componentes compartidos (¡ojo al tocarlos!)

- **`components/panel/ClienteBuscador.tsx`** — también en Señas. Búsqueda en vivo (ver `senas/ARCHITECTURE.md`), ya sin el bug de lista stale.
- **`components/panel/VehiculoSelector.tsx`** — también en Señas, Ventas y Permutas. **Bug corregido**: filtraba sobre el array `vehiculos` recibido por prop (query server-side de una sola vez, sin `.limit()` explícito) — un auto recién marcado "disponible" o cargado en la misma sesión no aparecía hasta recargar, y en un stock de +1000 autos disponibles ni siquiera llegaba completo por el corte default de PostgREST. Mismo patrón que `ClienteBuscador.tsx`: filtro local instantáneo con 1 carácter, consulta real server-side (debounce 300ms, `.eq("estado","disponible")`) desde 2 caracteres. Si tocás este componente, afecta a los 4 formularios que lo usan — no lo rompas para uno solo.

## Bug corregido: notificación a encargados mostraba "$0" en presupuestos cotizados solo en USD

`precioArs`/`precioUsd` son excluyentes — el mensaje de `notificarEncargados()` al no confirmar el precio armaba el texto solo con `precioArs`, así que un presupuesto cotizado 100% en USD notificaba "$0" sin mencionar el precio real. Ahora usa el mismo formato combinado ARS/USD que ya arma `precioTexto` para el modal de confirmación (`ConfirmarPrecioModal`).

## No tocar sin revisar el resto

- El número de presupuesto lo asigna la base (secuencia real) — nunca calcular `max(numero)+1` en el cliente, mismo criterio que Señas.
