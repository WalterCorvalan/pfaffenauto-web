# Expedientes — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Cómo se crea

`abrir_expediente_al_cerrar_venta` (trigger de base de datos, no está en este repo) crea el expediente automáticamente al pasar una venta a `estado = 'cerrada'` — nunca insertar un expediente a mano desde el cliente.

## Tabla de gastos: `expediente_gastos`

Cada gasto tiene `a_cargo_de`: `comprador` / `vendedor` / `agencia`. No son solo informativos — afectan los totales del tab Liquidación:

- `a_cargo_de = "comprador"` → un cobro **extra** que se **suma** al precio de venta para el "Total a cobrar al comprador" y el "Saldo pendiente al comprador".
- `a_cargo_de = "vendedor"` → una deducción que se **resta** del precio acordado con el propietario, antes de calcular honorarios, para "Total a liquidar (pre-honorarios)" y "Neto a pagar al propietario".
- `a_cargo_de = "agencia"` → solo aparece en "Resumen agencia" (`− Gastos no recuperados`), no afecta ni el cobro al comprador ni la liquidación al vendedor.

**Bug corregido**: los totales antes ignoraban estos gastos por completo aunque la pantalla los listaba justo arriba — ver `ExpedienteDetalleModal.tsx`, variables `totalACobrarComprador`/`totalALiquidarVendedor`. Solo se suman/restan gastos en la misma moneda que la venta/acuerdo (no hay conversión automática ahí — mismo criterio que `totalSenas`, ya existente en el archivo).

## Señas en otra moneda

`senasOtraMoneda`/`totalesSenasOtraMoneda` se calculan y se muestran aparte, pero **no** se descuentan del `saldoComprador` (no hay tipo de cambio disponible en este contexto para convertir) — es una limitación conocida, no un bug: si un comprador señó en una moneda distinta a la de la venta, el saldo mostrado no refleja esa seña y hay que restarla a mano.

## No tocar sin revisar el resto

- Si agregás un nuevo tipo de gasto o cambiás `a_cargo_de`, revisá que el efecto (suma/resta) en los totales de Liquidación siga la misma regla de arriba — no alcanza con que aparezca en el listado.
- `lib/moneda.ts` es la fuente de conversión del resto del panel (Señas, Ventas) — si en algún momento se resuelve la limitación de señas en otra moneda, usar esa utilidad en vez de escribir conversión propia acá.
