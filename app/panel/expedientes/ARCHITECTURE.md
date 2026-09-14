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

## Banner "pendientes de confirmación"

`pendientesConfirmacion` (`ExpedientesClient.tsx`) es un contador **global**: `!confirmado_comprador || !confirmado_consignacion`, sin filtrar por usuario — no existe un campo de responsable de confirmación, cualquiera puede tildar "Confirmar comprador"/"Confirmar consignación" desde `ExpedienteDetalleModal.tsx`. El copy dice "pendientes de confirmación" (antes decía "de **tu** confirmación", lo cual prometía una bandeja personal que el query no entrega — corregido). Si en algún momento se agrega un responsable real por expediente, ahí sí hay que filtrar por `miId` y el copy puede volver a decir "tu confirmación".

## Vista previa / imprimir

`app/panel/expedientes/imprimir/[id]/` — mismo patrón que Ventas/Señas/Presupuestos (`ImprimirX.tsx` con `window.print()`, header `print:hidden`, caja A4 abajo). Se accede con el ícono 👁 en la columna de acciones del listado (no hay un botón único de "Vista previa" a nivel de toda la lista — cada expediente tiene el suyo, mismo criterio que el resto del panel). Trae hitos de transferencia, checklist de documentación por parte, gastos y el estado de confirmación de ambas partes.

## "Demorado" en el listado

`ExpedientesClient.tsx` muestra "⚠ Demorado — Xd +Yd" en vez de la barra de progreso cuando `dias > PLAZO_TRANSFERENCIA_DIAS` (15). `+Yd` es `dias - PLAZO_TRANSFERENCIA_DIAS`, los días de más sobre el plazo, no el total. `motivo_demora` es un campo de texto libre en `expedientes` (columna nueva, ver `migraciones/sql_expedientes_motivo_demora.sql` — correrla antes de usar "Registrar motivo de demora", si no está corrida el guardado falla con un alert explícito en vez de romper silenciosamente). Se edita desde el listado mismo (inline), no hace falta abrir el detalle.

## Pedido de atención — responder lo cierra

`expedientes.pedido_atencion_sector`/`pedido_atencion_mensaje` son campos flat que alimentan el banner indigo — se escriben insertando una fila en `expediente_observaciones` con `tipo: "pedido_atencion"` (no hay un `.update()` directo a esos campos desde `pedirAtencion()`; algo del lado de la base los sincroniza con la última observación de ese tipo). `responderPedido()` inserta la respuesta como otra observación (`tipo: "respuesta_pedido_atencion"`, para distinguirla en el Historial con el ícono ↩️) y **sí** limpia esos dos campos flat directamente vía `.update()`, cerrando el pedido. Solo soporta un pedido activo a la vez (no es un hilo con múltiples pedidos abiertos en paralelo) — si se necesita eso, hay que sumar una tabla dedicada en vez de seguir reusando `expediente_observaciones` + campos flat.

## Revertir una confirmación

`confirmarParte()`/`revertirParte()` en `ExpedienteDetalleModal.tsx` son simétricas: confirmar setea `confirmado_X`/`confirmado_X_en`/`confirmado_X_por`, revertir los vuelve a `false`/`null`/`null`. Revertir una confirmación cuando la otra parte ya estaba confirmada vuelve a bloquear el expediente entero (mismo criterio que `pendienteConfirmacion` de arriba) — es intencional: no hay forma de "revertir solo a medias".

## Tabs "Parte Vendedora" / "Parte Compradora"

Datos personales de cada parte + su checklist de documentación, en un tab propio (antes solo vivían mezclados en Documentos/Gestoría). Casi todos los campos ya existían en otras tablas, no fue necesario crear casi nada nuevo:

- **Comprador**: los 6 campos (`nombre`/`dni`/`telefono`/`email`/`fecha_nacimiento`/`profesion`) ya estaban en `ventas.comprador_*` — se editan y guardan ahí directo, sin campo nuevo.
- **Vendedor/propietario**: `nombre`/`telefono` están en `ventas.propietario_*` (se cargan una vez al vincular el auto a la venta). `dni`/`email`/`fecha_nacimiento` viven en `vehiculos.propietario_*` (son del auto, no de la venta puntual — si el mismo propietario vende otro auto, son registros separados). `profesion` era el único campo que faltaba → `vehiculos.propietario_profesion` (nuevo, ver `migraciones/sql_vehiculos_propietario_profesion.sql`). El guardado de este último campo está en su propio `try/catch` en `guardarCambios()`: si la migración todavía no corrió, ese `update` puntual falla solo y no rompe el resto del guardado (comprador, hitos, etc.).
- El botón WhatsApp de cada parte reusa `whatsapp()` (mismo helper que ya usaba Comprobantes/Pago Comprador).
- La sección "Documentación requerida" de cada tab reusa `toggleChecklistItem`/`subirArchivoItem` (las mismas funciones que ya alimentan el resumen "Docs Vendedor X/Y" y el tab Gestoría) — no hay lógica de checklist duplicada. `agregarDocumentoChecklist(parte)` es nuevo: permite sumar un ítem suelto al checklist de esa parte (`orden = max(orden existente) + 1`).
- Los tabs Documentos y Gestoría **no se tocaron** — siguen mostrando lo mismo que antes; estos dos tabs nuevos son una vista adicional centrada en la persona, no un reemplazo.

## No tocar sin revisar el resto

- Si agregás un nuevo tipo de gasto o cambiás `a_cargo_de`, revisá que el efecto (suma/resta) en los totales de Liquidación siga la misma regla de arriba — no alcanza con que aparezca en el listado.
- `lib/moneda.ts` es la fuente de conversión del resto del panel (Señas, Ventas) — si en algún momento se resuelve la limitación de señas en otra moneda, usar esa utilidad en vez de escribir conversión propia acá.
- Los datos personales de comprador/propietario están repartidos en 2 tablas (`ventas`/`vehiculos`, ver "Tabs Parte Vendedora/Compradora" arriba) — si agregás un campo nuevo, pensá primero si es "de la venta" o "del auto" antes de elegir dónde guardarlo.
