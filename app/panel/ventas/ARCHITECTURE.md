# Ventas — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Tabla principal

`public.ventas` — columnas relevantes agrupadas por tema:

- **Precio/moneda**: `precio_venta`, `moneda_venta` (ARS o USD, excluyentes), `tipo_cambio`. `tipo_cambio` se escribe **en el insert/update directo del payload** (no solo vía el RPC de efectivo) desde el fix de P1-06 — si agregás un campo nuevo relacionado a pago, no asumas que un solo RPC es la única vía de escritura, revisá ambos caminos.
- **Efectivo recibido**: `pago_efectivo_ars`, `pago_efectivo_usd`, sus `_cuenta_id` y `_movimiento_id`. Se escriben solo a través del RPC `registrar_pago_efectivo_venta` (revierte el movimiento anterior con `eliminar_movimiento_caja` antes de crear uno nuevo, para no duplicar en Tesorería al reeditar). **Estos son los únicos campos que representan cobro real** — no asumir que `metodo_pago = 'Contado'` implica que se cobró el precio completo (bug corregido en P0-03: el recibo declaraba "cobrado en efectivo" un monto que nunca se cargó).
- **Estado**: `estado` (`borrador`/`activa`/`reserva`/`cerrada`/`caida`/`cancelada`). Transiciones válidas en `TRANSICIONES` (objeto en `VentaDetalleModal.tsx`) — no todos los estados pueden ir a todos lados.
- **Vínculos**: `vehiculo_id`, `cliente_id`, `vendedor_id`.

## Componentes

- **`NuevaVentaModal.tsx`** — alta y edición (mismo componente, rama por `esEdicion`). Contiene `vincularSena()` (trae señas `Activa` y las asocia) y `guardarPagoEfectivo()` (llama al RPC). El prop `initial: VentaPrefill` precarga el modal cuando se entra desde "Convertir en venta" de una cotización aprobada (`VentasClient.tsx`) — usa `precio_aprobado ?? precio_sugerido` de la cotización (no siempre son iguales: `precio_aprobado` es lo que un admin negoció vía `ModificarCotizacionModal.tsx`) y carga el bloque de permuta si la cotización tenía una.
- **`VentaDetalleModal.tsx`** — detalle, cambio de estado (`cambiarEstado()`), edición de comisión (`guardarComision()`), marcar operación caída (`marcarCaida()`, vía RPC `marcar_operacion_caida`).
- **`VentasClient.tsx`** — listado/tabla. El ícono de Recibo enlaza a `/panel/ventas/imprimir/[id]` (mismo documento que el botón "Ver / Imprimir" del detalle — antes estaba deshabilitado ahí, corregido en P1-14). El ícono de Boleto sigue deshabilitado a propósito: ese documento no está implementado.
- **`imprimir/[id]/page.tsx` + `ImprimirVenta.tsx`** — recibo imprimible. `senaPrevia` se calcula sumando `venta_senas` **convertidas a la moneda de la venta** con `lib/moneda.ts`; "se recibe en efectivo" usa `pago_efectivo_ars`/`usd`, no el precio total.

## Patrón `.maybeSingle()` — no volver a `.single()`

Los tres guardados de venta (edición, cambio de estado, edición de comisión) usan `.update(...).select().maybeSingle()`, no `.single()`. `.single()` explota con `"Cannot coerce the result to a single JSON object"` cuando el UPDATE no puede releer la fila (RLS bloqueando el SELECT posterior, o un trigger de base de datos abortando la transacción). Si agregás un guardado nuevo a `ventas`, seguí el mismo patrón: `maybeSingle()` + chequeo explícito de `!data`.

## Trigger sospechoso en el cierre

`generar_comisiones_al_cerrar_venta()` (en `migraciones/sql_fix_modo_comision.sql`) se dispara al pasar `estado = 'cerrada'` e inserta en `public.comisiones`. Si esa inserción falla (FK/NOT NULL en `creado_por`, vendedor sin fila en `perfiles`), aborta todo el UPDATE de la venta. No confirmado como causa raíz del bloqueo de cierre reportado en la auditoría (P1-09) — pendiente de reproducir con logs reales en runtime.

## Componentes compartidos (¡ojo al tocarlos!)

- **`components/panel/VehiculoSelector.tsx`** — compartido con Señas, Presupuestos, Permutas. No expone `condicion`.
- **`components/panel/ClienteBuscador.tsx`** — compartido con Señas. El selector de "Cliente del CRM" en Nueva Venta usa una lista simple (`<select>` con `clientes` recibidos por props), **no** el buscador con paginación/búsqueda server-side — con miles de clientes, buscar por nombre puede no encontrar resultados fuera del primer lote (hallazgo P1-11, parte no resuelta).

## No tocar sin revisar el resto

- El cálculo de saldo del recibo (`ImprimirVenta.tsx`) depende de `lib/moneda.ts` — mismo criterio que Señas, no dupliques lógica de conversión acá.
- **La conversión de señas por moneda hay que aplicarla en todos los lugares que las suman**, no solo en el recibo: `imprimir/[id]/page.tsx` (`senaPrevia`), `page.tsx` (`senasPorVenta`, alimenta la columna "Adelanto" de `VentasClient.tsx`), `VentaDetalleModal.tsx` (`totalSenas`) y `NuevaVentaModal.tsx` (`totalSenas`/`totalPermutas` del bloque que genera el plan de cuotas cuando `metodoPago === "Financiado"`). Los tres primeros quedaron sin convertir en auditorías anteriores y se corrigieron: `page.tsx` sumaba montos crudos sin importar la moneda, `VentaDetalleModal.tsx` descartaba (ponía en $0) cualquier seña en moneda distinta a `venta.moneda_venta`, y `NuevaVentaModal.tsx` sumaba `s.monto`/`p.valor` crudos (señas y permutas) al calcular el saldo a financiar — una seña o permuta en la moneda "equivocada" inflaba o arruinaba el monto de cada cuota. Si agregás un lugar nuevo que sume `venta_senas` o `venta_permutas`, usá `totalEnMoneda(..., monedaVenta, tipoCambio)` de `lib/moneda.ts`, mismo patrón.
- `abrir_expediente_al_cerrar_venta` (trigger de base de datos, no está en este repo) crea el expediente automáticamente al cerrar — no insertar un expediente a mano desde el cliente.
- **Eliminar una venta ya no es un `DELETE` real** — es borrado lógico vía `POST /api/panel/papelera`, revierte `vehiculos.estado` y arrastra al expediente vinculado (son 1:1). Ver `app/panel/papelera/ARCHITECTURE.md`. No vuelvas a `supabase2.from("ventas").delete(...)` directo desde ningún componente de este módulo — `VentaDetalleModal.tsx` tenía su propio botón "Eliminar" con el `DELETE` viejo, sin actualizar cuando se migró `VentasClient.tsx` a Papelera (corregido). Si el módulo tiene más de un lugar con acción de eliminar, revisá todos, no solo el listado.
