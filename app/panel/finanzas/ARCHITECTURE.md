# Finanzas — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Tabla principal

`public.movimientos_caja` — cada fila es un ingreso o egreso de una cuenta (`cuenta_id` → `cuentas`, que tiene la `moneda`). Columnas clave:

- `tipo`: `ingreso` / `egreso`. `monto` siempre se guarda en positivo — el signo lo da `tipo`, no restar directamente `monto` sin filtrar por `tipo` antes.
- `tipo_movimiento`: la categoría (ej. "Sueldo", "Alquiler", "Transferencia", etc.).
- `estado`: `aprobado` / `pendiente`. Los totales de caja real solo cuentan `aprobado`.
- `deleted_at`: soft-delete (ver `public.eliminar_movimiento_caja` RPC) — siempre filtrar `.is("deleted_at", null)`.

## Regla de negocio: transferencias entre cajas propias NUNCA son ingreso/egreso real

Una transferencia entre dos cuentas propias (`tipo_movimiento === "Transferencia"`) genera un egreso en la cuenta de origen y un ingreso en la de destino — es la misma plata moviéndose, no un ingreso o gasto real de la empresa. **Toda métrica de ingresos/egresos/resultado sobre `movimientos_caja` tiene que excluir `tipo_movimiento === "Transferencia"`**, o infla ambos brutos (y si las dos patas caen en monedas distintas, distorsiona directamente el neto por moneda).

Esto ya causó dos bugs de auditoría por quedar aplicado en un lugar pero no en el resto de las queries sobre la misma tabla:
- `FinanzasClient.tsx` (`cajaPorSucursal`) lo aplicaba, pero `ingresosTotales`/`egresosTotales` del mismo archivo no (corregido).
- `app/panel/page.tsx` (Dashboard, Cash Flow del mes) lo aplicaba, pero las queries de "Top 10 gastos" y "Gastos atípicos" del mismo archivo no (corregido).
- `LibrosContablesTab.tsx` (Estado de resultados) y `ReportesClient.tsx` ya lo aplicaban correctamente desde el inicio.
- `RentabilidadTab.tsx` (`delArea`, tiles "Ingresos/Egresos/Neto del área") tampoco lo aplicaba — mismo bug, tercera reaparición (corregido).

Si agregás una métrica nueva sobre `movimientos_caja`, aplicá este filtro salvo que la métrica sea explícitamente sobre movimiento de caja bruto (ej. "cantidad total de operaciones registradas").

## Nunca mezclar ARS con USD

Todo cálculo de dinero en este módulo pivotea a un `Record<moneda, monto>` (un total por moneda) en vez de sumar todo a un solo número — la moneda vive en `cuentas.moneda`, no en el movimiento, así que siempre se resuelve por `cuenta_id`. Ver `lib/moneda.ts` para conversión explícita cuando hace falta comparar/sumar montos de monedas distintas (ej. saldo pendiente de una seña con pagos en ambas monedas).

## Saldo de cuenta — siempre en vivo, nunca cacheado

El saldo real de una cuenta se calcula vía RPC `saldo_cuenta(p_cuenta_id)`, nunca se lee un campo `saldo_inicial` cacheado como si fuera el saldo actual (ese campo es solo el monto de apertura de la caja).

## No tocar sin revisar el resto

- No sumar `movimientos_caja.monto` sin filtrar `estado = "aprobado"` y `deleted_at is null` primero.
- No agregar una métrica de ingresos/egresos sobre `movimientos_caja` sin excluir `tipo_movimiento = "Transferencia"` (ver regla arriba).
