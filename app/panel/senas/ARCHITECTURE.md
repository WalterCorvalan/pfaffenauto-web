# Señas — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Tabla principal

`public.senas` — cada fila es una seña/reserva. Campos clave:
- `venta_ars` / `venta_usd` (mutuamente excluyentes): precio pactado de la venta, en una sola moneda.
- `sena_ars` / `sena_usd` (mutuamente excluyentes): monto de la seña, en una sola moneda — **puede estar en una moneda distinta a `venta_*`**.
- `tipo_cambio`: cotización cargada por el vendedor. Necesaria para convertir cuando seña y venta están en monedas distintas.
- `saldo_abonar_ars` / `remanente_ars`: a pesar del nombre `_ars`, en realidad quedan en la **moneda de la venta** (ARS o USD) desde el fix de `lib/moneda.ts` (Fase 1 de la auditoría de sep-2026). No renombrar la columna sin migrar todos los lectores.
- `vehiculo_id`: FK a `vehiculos`. Puede ser null si la seña se cargó a mano (vehículo fuera de stock).
- `cuenta_id`: si se eligió, dispara el registro en Tesorería (ver abajo).
- `estado` / `etapa_seguimiento`: `Activa` → `Convertida` (al vincularse a una venta) o `Perdida` (anulada). `SenaDetalleModal.tsx` tiene el mapeo de labels.

## Componentes

- **`NuevaSenaModal.tsx`** — alta. Calcula `saldoCalculado`/`remanenteCalculado` con `lib/moneda.ts` (`convertirMonto`/`totalEnMoneda`), **nunca sumar campos `_ars`/`_usd` a mano** — eso fue el bug P0-01 de la auditoría (seña en USD contada como $0).
- **`EditarSenaModal.tsx`** — edición liviana (nombre, contacto, montos), sin repetir los efectos colaterales de la carga inicial (estado del vehículo, movimiento de caja, notificaciones). **Bug corregido**: al corregir `venta_ars`/`venta_usd`/`sena_ars`/`sena_usd` no recalculaba `saldo_abonar_ars`/`remanente_ars` — el recibo (`ImprimirSena.tsx`) y el detalle seguían mostrando el saldo/remanente de antes de la corrección. Ahora los recalcula con el mismo criterio que `NuevaSenaModal.tsx` (`lib/moneda.ts`), reusando `sena.tipo_cambio`/`prenda_monto`/`patentamiento_transferencia_ars`/`efectivo_ars`/`efectivo_usd`/`permuta_tasado_ars` tal cual venían (esos campos no son editables desde este form).
- **`SenaDetalleModal.tsx`** — vista rápida (modal), no imprimible.
- **`imprimir/[id]/page.tsx` + `ImprimirSena.tsx`** — recibo imprimible. Lee `vehiculo:vehiculo_id ( condicion, radicado_localidad )` con join — la condición 0KM/usado y la localidad **vienen del vehículo real**, no se adivinan por año ni se toma la localidad del cliente (bug corregido P1-13).
- **`EstadoSenaSelector.tsx`** — cambio de estado desde el listado.

## Componentes compartidos (¡ojo al tocarlos!)

- **`components/panel/VehiculoSelector.tsx`** — también lo usan Nueva Venta, Presupuestos y Permutas. **No expone el campo `condicion`** del vehículo (por eso el recibo de seña hace un join aparte a `vehiculos` en vez de leerlo del selector). Si necesitás más campos del vehículo en el form, evaluá si conviene agregarlos acá (afecta a los 4 formularios) o resolverlo en el consumidor, como se hizo con `condicion`.
- **`components/panel/ClienteBuscador.tsx`** — selector de cliente, compartido con Ventas.
- **`components/panel/ConfirmarPrecioModal.tsx`** — confirma si el vendedor está seguro del precio antes de guardar.

## Efectos secundarios al guardar una seña

1. `vehiculos.estado` → `'señado'` (si hay `vehiculo_id`).
2. Si se eligió `cuenta_id`: RPC `registrar_movimiento_caja` (ingreso en Tesorería), montos condicionalmente en USD o ARS según la moneda de la cuenta destino — **no convierte**, asume que el monto ya está en la moneda de la cuenta.
3. Notificación a encargados si `!precioConfirmado`.

## Conexión con Ventas

- `NuevaVentaModal.tsx` puede vincular una seña `Activa` existente: al vincular, copia el pago a `venta_senas` y marca la seña como `Convertida`. Desde la Fase 4 (P1-11), vincular también completa cliente y vehículo del comprador automáticamente si la seña los tenía identificados (`cliente_id`, `vehiculo_id`) — ver `vincularSena()` en `NuevaVentaModal.tsx`.
- `app/panel/ventas/imprimir/[id]/page.tsx` lee `venta_senas` para descontar la seña del recibo de venta, convirtiendo con `lib/moneda.ts` si la moneda no coincide con la de la venta.

## No tocar sin revisar el resto

- El cálculo de saldo/remanente: única fuente de verdad es `lib/moneda.ts`. Duplicar la lógica en otro componente reintroduce el bug de moneda.
- El número de seña lo asigna la base (secuencia real) — nunca calcular `max(numero)+1` en el cliente, eso causaba condición de carrera.
