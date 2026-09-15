# Guía de testing — uso real del panel, módulo por módulo

Esta guía está pensada para ejecutarse desde una sesión de Claude Code **local** (con acceso de red real a Supabase — una sesión cloud no llega al host de la base, ver nota al final). El objetivo no es abrir cada módulo aislado y mirar que no tire error — es **simular un día de trabajo real**, en el orden en que los datos realmente se generan unos a partir de otros, y verificar en cada paso que lo que un módulo crea aparece correcto en todos los módulos que dependen de él.

**Quedan afuera de esta guía**: Rodi (chatbot del sitio público) y WhatsApp (`/panel/whatsapp`) — no se tocan en esta ronda.

## Cómo usar esta guía

1. Levantar el panel: `npm run dev`, loguearse con un usuario real que tenga rol `admin` (necesita ver todo: Autorizaciones, Papelera, Liquidaciones, etc.).
2. Ir fase por fase, en orden — varias fases dependen de datos creados en la fase anterior. No saltear el orden.
3. Usar Playwright (Chromium ya viene preinstalado en el entorno, ver system prompt del proyecto) para navegar, tipear, clickear y sacar una captura después de cada paso marcado con 📸 — así queda evidencia visual de que el dato se ve bien, no solo que la request no tiró 500.
4. Marcar cada casillero. Si algo falla, anotar el módulo, el paso exacto, y el error (texto en pantalla o de la consola del browser) antes de seguir — no hace falta arreglarlo ahí mismo, primero completar el recorrido para tener el panorama completo, después priorizar.
5. Todos los datos de prueba deben llevar un prefijo reconocible (ej. `TEST-` en nombres, `test+fecha@pfaffenauto.qa` en emails) para poder limpiarlos después sin tocar datos reales.

---

## Fase 0 — Setup y accesos

- [ ] `npm install` sin errores.
- [ ] `npm run dev` levanta sin errores en consola.
- [ ] Login con usuario `admin` real. 📸 Dashboard carga con KPIs (no en blanco, no "0" en todo si ya hay datos históricos).
- [ ] `/panel/configuracion/usuarios` — confirmar que existe al menos un usuario con rol `ventas` activo (lo vas a necesitar para asignar vendedor en Ventas/Leads/Visitas) y uno con rol `finanzas` o `encargado`.
- [ ] `/panel/configuracion` (Empresa) — anotar qué sucursales existen (Casa Central / Don Torcuato u otras) y la config de comisiones (`comision_vendedor_pct` default, `paga_comisiones` habilitado sí/no) — si está deshabilitado, activarlo temporalmente o el módulo Comisiones va a aparecer vacío/bloqueado en la Fase 5.

## Fase 1 — Datos base (todo lo demás depende de esto)

### Stock (`/panel/stock`)
- [ ] Crear **al menos 3 vehículos** `disponible`, variando a propósito:
  - 1 en ARS, 1 en USD (para probar que nada mezcla monedas).
  - 2 sucursales distintas si hay más de una.
  - Categorías distintas (ej. uno "Auto", uno "Pickup/Camioneta") — necesario para probar el filtro de categoría en Pedidos/stock.
  - Al menos uno con `precio_publicado_ars`/`usd` cargado (el precio público, distinto del interno).
- [ ] 📸 Verificar que cada auto creado aparece en la grilla con moneda y precio correctos, sin mezclar $ y US$.

### Clientes (`/panel/clientes`)
- [ ] Crear 2 clientes de prueba (`TEST-Cliente1`, `TEST-Cliente2`), con teléfono y DNI.
- [ ] 📸 Verificar que aparecen en el listado, buscador los encuentra por nombre y por teléfono.

---

## Fase 2 — Entradas comerciales (Comercial)

### Visitas (`/panel/visitas`)
- [ ] Agendar una visita nueva, vinculada a uno de los `TEST-Cliente` y a uno de los vehículos de stock, con vendedor asignado.
- [ ] 📸 Verificar que aparece en "Citas Próximas" y que el badge de estado (Pendiente/Confirmada/Asistió/Cancelada) tiene el color correcto.
- [ ] Ir a `/panel/calendario` — 📸 confirmar que la visita **no** aparece ahí (Visitas y Calendario son tablas separadas — `eventos_calendario` vs `visitas` — confirmar que no se mezclan ni se duplican).

### Leads (`/panel/leads`)
- [ ] Crear un lead manual (`+ Nuevo lead`), con canal de origen y sucursal.
- [ ] 📸 Verificar que aparece en el listado unificado con el ícono/color de origen "Manual".

### Cotizaciones (`/panel/cotizaciones`)
- [ ] Crear una cotización nueva sobre uno de los vehículos de stock, para `TEST-Cliente1`.
- [ ] Aprobarla — si el precio aprobado difiere del sugerido, modificarlo a propósito (para probar que `precio_aprobado` se usa después, no `precio_sugerido`).
- [ ] 📸 Confirmar que el estado pasa a "Aprobada" y que aparece el botón **"Convertir en venta"**.
- [ ] Click en "Convertir en venta" → 📸 confirmar que el modal de Nueva Venta se abre precargado con: nombre del cliente, vehículo, y el **precio aprobado** (no el sugerido, si fueron distintos). Si la cotización tenía datos de permuta, confirmar que el bloque de permuta también viene precargado. **No completar el alta todavía** — cerrar el modal sin guardar, esta venta se crea de verdad en la Fase 3.

### Presupuestos (`/panel/presupuestos`)
- [ ] Crear un presupuesto para `TEST-Cliente2` sobre otro vehículo del stock.
- [ ] 📸 Abrir "Ver / Imprimir" — confirmar que el PDF/vista imprimible muestra los datos reales (no placeholders), moneda correcta.

### Señas (`/panel/senas`)
- [ ] Crear una seña nueva **en una moneda distinta a la del vehículo** a propósito (ej. vehículo en USD, seña en ARS) — esto es el caso que el código convierte explícitamente con `lib/moneda.ts`, el más propenso a bug si algo se rompió.
- [ ] Elegir una cuenta de Tesorería como destino del cobro.
- [ ] 📸 Guardar y confirmar: (a) el vehículo en Stock pasa a estado `señado`, (b) en `/panel/tesoreria` aparece el movimiento de ingreso en la cuenta elegida, con el monto en la moneda de la seña (sin convertir — el código documenta que acá NO convierte, asume que el monto ya está en la moneda de la cuenta destino — confirmar que la cuenta elegida es de esa misma moneda o el monto va a quedar mal).
- [ ] Dejar esta seña como "Activa" — se usa en la Fase 3.

### Financiaciones (`/panel/financiaciones`)
- [ ] Este módulo se alimenta de formularios públicos del sitio (`leads_tasacion` tipo financiación) — no tiene alta manual desde el panel. Si no hay ninguna solicitud real, **omitir la carga** y solo verificar 📸 que la pantalla vacía muestra el estado "sin solicitudes" correctamente (no un error).

---

## Fase 3 — Ventas (el módulo bisagra)

Todas las pruebas siguientes son ventas separadas, para cubrir los 3 caminos de alta:

### 3A — Venta directa desde stock (sin seña, sin cotización)
- [ ] `/panel/ventas` → Nueva venta, elegir el 3er vehículo de stock, `TEST-Cliente1`, método de pago **Contado**.
- [ ] Guardar con estado `activa` primero (no cerrada todavía).
- [ ] 📸 Confirmar que aparece en el listado con el estado correcto y el precio en la moneda correcta.

### 3B — Venta vía "Convertir en venta" desde la Cotización aprobada (Fase 2)
- [ ] Repetir el flujo desde Cotizaciones → "Convertir en venta", esta vez sí completar y guardar.
- [ ] 📸 Confirmar que la venta se creó con el precio aprobado (no el sugerido) y el vehículo correcto.

### 3C — Venta vinculando la Seña activa (Fase 2)
- [ ] Nueva venta sobre el mismo vehículo de la seña, elegir "vincular seña existente".
- [ ] 📸 Confirmar: (a) el pago de la seña aparece reflejado en el saldo/adelanto de la venta, (b) al volver a `/panel/senas`, esa seña ahora figura como **Convertida** (ya no aparece como Activa).

### 3D — Cerrar una venta y verificar la cascada automática
- [ ] Sobre la venta de 3A, cambiar estado a **Cerrada**.
- [ ] 📸 `/panel/expedientes` — confirmar que se creó un expediente automáticamente vinculado a esa venta (trigger `abrir_expediente_al_cerrar_venta`), sin haberlo creado a mano.
- [ ] 📸 `/panel/comisiones` — confirmar que apareció una comisión para el vendedor de esa venta (trigger `generar_comisiones_al_cerrar_venta`).
- [ ] 📸 `/panel/stock` — confirmar que el vehículo pasó a estado `vendido`.

### 3E — Papelera: los dos caminos de eliminar una venta (bug ya corregido, confirmar que sigue bien)
- [ ] Sobre la venta 3B (todavía sin cerrar): eliminarla desde el botón de la fila en `VentasClient` (listado).
- [ ] 📸 Confirmar que aparece en `/panel/papelera`, no que desapareció sin dejar rastro.
- [ ] Restaurarla desde Papelera. 📸 Confirmar que vuelve a aparecer en Ventas.
- [ ] Ahora eliminarla de nuevo, esta vez desde el botón "Eliminar" **dentro del modal de detalle** (`VentaDetalleModal`) — este es el camino que tenía el bug de `DELETE` directo, corregido esta sesión.
- [ ] 📸 Confirmar que también queda en Papelera (no un borrado real e irreversible) y que el vehículo asociado (si estaba `vendido`/`reservado`) vuelve a `disponible`.

---

## Fase 4 — Expedientes (depende de la Fase 3D)

- [ ] Abrir el expediente creado automáticamente en 3D.
- [ ] 📸 Confirmar que los datos del comprador/vendedor/vehículo coinciden con los de la venta.
- [ ] Cargar algún dato propio del expediente (ej. una cuenta de registro, un gasto) y confirmar que se guarda.
- [ ] Eliminar el expediente desde el botón "Eliminar" del `ExpedienteDetalleModal` (el otro bug de `DELETE` directo corregido esta sesión).
- [ ] 📸 Confirmar en Papelera: el expediente **y la venta 3A vinculada** quedaron los dos en Papelera juntos (son 1:1, se eliminan en cascada). Restaurar y confirmar que ambos vuelven.

---

## Fase 5 — Módulos de dinero que dependen de las ventas

### Comisiones (`/panel/comisiones`)
- [ ] 📸 Confirmar que la comisión de 3D aparece con el vendedor y monto correctos.
- [ ] Marcarla como cobrada (o pago parcial) y confirmar que el estado cambia y el monto pendiente se recalcula bien.

### Mis Ventas (`/panel/mis-ventas`)
- [ ] Entrar como (o simular) el vendedor de la venta 3D.
- [ ] 📸 Confirmar que la venta aparece atribuida a ese vendedor, con la comisión correcta, en el período "Este mes".

### Cobros (`/panel/cobros`) — solo si alguna venta quedó Financiada
- [ ] Si en 3A/3B se eligió método "Financiado", confirmar que se generaron cuotas a cobrar.
- [ ] 📸 Cobrar una cuota, confirmar que se registra el movimiento en la cuenta de Tesorería elegida.

### Tesorería (`/panel/tesoreria`)
- [ ] 📸 Confirmar que el saldo de cada cuenta usada en las fases anteriores (seña, cuota cobrada) refleja los movimientos reales — comparar contra la suma manual de lo cargado.

### Finanzas (`/panel/finanzas`)
- [ ] Pestaña Movimientos: 📸 confirmar que todos los movimientos de las fases anteriores aparecen.
- [ ] Pestaña Resumen: 📸 confirmar que "Ingresos"/"Egresos"/"Neto" del mes reflejan lo cargado, y que si el neto da negativo se ve en rojo (no azul — bug ya corregido, confirmar que sigue bien).
- [ ] Cargar una Transferencia entre dos cuentas propias (botón "Transferencia" en Movimientos) — 📸 confirmar que **no** se suma ni a ingresos ni a egresos del resumen (regla documentada en `finanzas/ARCHITECTURE.md`: una transferencia interna nunca es ingreso/egreso real).

---

## Fase 6 — Gestoría / Consignaciones / Peritajes

### Peritajes (`/panel/peritajes`)
- [ ] Crear un peritaje nuevo sobre uno de los vehículos, completar el diagrama de carrocería con algún daño.
- [ ] 📸 Confirmar que el puntaje calculado se colorea: verde si ≥70, amarillo si ≥40, **rojo** si <40 (bug de color ya corregido — confirmar que un puntaje bajo se ve rojo, no azul).

### Consignaciones (`/panel/consignaciones`)
- [ ] Crear una consignación nueva.
- [ ] 📸 Confirmar el detalle, y que "Eliminar" funciona (acá sí es un DELETE real — este módulo no está en Papelera, confirmar que no rompe nada relacionado).

### Gestoría / Liquidaciones (`/panel/gestoria`, `/panel/liquidaciones`)
- [ ] En Liquidaciones, cargar una transferencia de gestoría nueva (dominio, montos).
- [ ] 📸 Confirmar que la comisión gestora y el ingreso agencia se calculan bien, y que en Gestoría aparece el estado de esa transferencia.

---

## Fase 7 — Autorizaciones (depende de una acción restringida)

- [ ] Con un usuario que **no** sea admin, intentar editar la comisión de la venta 3D (`VentaDetalleModal` → Editar comisión) — no debería aplicarse directo, tiene que generar una solicitud.
- [ ] 📸 Como admin, ir a `/panel/autorizaciones` y confirmar que la solicitud aparece con los datos correctos (antes/después).
- [ ] Aprobarla. 📸 Confirmar que el cambio se aplicó de verdad en la venta.
- [ ] Repetir con otra acción restringida si el rol de prueba lo permite (ej. editar importes bloqueados de una liquidación ya confirmada).

---

## Fase 8 — Módulos sueltos (bajo acoplamiento, pero verificar igual)

### Reclamos (`/panel/reclamos`)
- [ ] Crear un reclamo nuevo sobre `TEST-Cliente1`.
- [ ] Cerrarlo con una nota de cierre — 📸 confirmar que la tarjeta de "Nota de cierre" se ve en rosa consistente (bug de color ya corregido, confirmar que no volvió).

### Postventa (`/panel/postventa`)
- [ ] Cargar una compra de postventa manual (o importar un Excel de prueba si hay un flujo de importación).
- [ ] Crear un recordatorio pendiente.
- [ ] 📸 Confirmar que aparece en el listado de recordatorios pendientes.

### Pedidos (`/panel/pedidos`)
- [ ] Cargar un pedido nuevo ("avisame cuando entre") con marca/modelo que **no** esté en stock.
- [ ] 📸 Confirmar que queda como pendiente. (El match automático contra stock nuevo es un cron — no se puede probar en caliente sin esperar o disparar el cron a mano; anotar como "no testeado en este pase" si no se dispara manualmente.)

### Infracciones, Telefonos, Taller (si están en el menú del usuario de prueba)
- [ ] Recorrida rápida: crear un registro de prueba en cada uno, confirmar que el listado lo muestra sin errores. No hace falta profundizar si no están en el foco de negocio actual — el objetivo acá es solo "no está roto", no un test exhaustivo.

---

## Fase 9 — Módulos de reporting (deberían reflejar TODO lo anterior)

### Dashboard (`/panel`)
- [ ] 📸 Confirmar que los KPIs del día/mes incluyen las ventas, comisiones y movimientos cargados en las fases anteriores.
- [ ] Pestaña Cockpit CEO: 📸 confirmar que la variación anual, si da negativa, se ve en rojo (bug ya corregido).

### Reportes (`/panel/reportes`)
- [ ] Recorrer cada pestaña (ranking, embudo, expedientes, cotizaciones, stock, etc.) — 📸 confirmar que los números incluyen los datos de prueba cargados y que ningún tier de color (conversión 0%, leads calientes, etc.) quedó en azul después de los fixes de esta sesión.

### Marketing (`/panel/marketing/*`)
- [ ] Recorrida rápida de cada sub-pestaña (generales, instagram, pautas, embudo, chatbot, pautados, busquedas) — confirmar que cargan sin error. La mayoría de estos datos vienen de integraciones externas (Meta, IA) que no se generan con este testing manual — alcanza con confirmar que la pantalla no rompe con datos vacíos.

### Alertas (`/panel/alertas`)
- [ ] 📸 Confirmar que las notificaciones generadas por las fases anteriores (autorización pendiente en Fase 7, cuota vencida si aplica) aparecen acá con la prioridad correcta.

### Calendario (`/panel/calendario`)
- [ ] Crear un evento de calendario de prueba (distinto de la Visita de Fase 2).
- [ ] 📸 Confirmar que aparece en la vista de mes/semana/día correctamente.

### Mi Espacio / Mi Perfil (`/panel/mi-espacio`, `/panel/mi-perfil`)
- [ ] Cargar un movimiento de "Saldo con la agencia" (saque o aporte) — 📸 confirmar que "Agencia me debe"/"Yo debo a agencia" queda del lado correcto (bug de inversión ya corregido dos veces esta sesión — el de más alto riesgo de todos si algo se rompió).
- [ ] Confirmar que el mismo dato se ve consistente en la pestaña Patrimonio (mismo cálculo, dos lugares distintos).

---

## Fase 10 — Cierre y limpieza

- [ ] `/panel/papelera` — confirmar que todo lo eliminado a propósito en esta guía (Fase 3E, Fase 4) está ahí y es restaurable/eliminable definitivamente por un admin.
- [ ] Si se creó todo con prefijo `TEST-`, eliminar definitivamente (Papelera → eliminar para siempre) los registros de prueba que no se quieran dejar en la base — **confirmar con el dueño de los datos antes de borrar nada real por error**.
- [ ] Revisar la consola del browser en cada fase por errores silenciosos (requests fallidos que no se mostraron como alert visible) — anotar aunque la UI no haya roto visualmente.

---

## Nota sobre por qué esto no se pudo correr desde la sesión cloud

Esta sesión de Claude Code corre en un entorno remoto administrado (cloud), con un proxy de salida que bloquea por política de organización el acceso directo al host de Supabase del proyecto (`vdcpmbajlyqgohrwpkeo.supabase.co`, `403` confirmado contra el proxy). Sin esa conexión, el panel no puede pedir datos reales y no hay nada que testear de verdad — por eso esta guía quedó preparada para ejecutarse desde una sesión **local**, donde no existe esa restricción de red.
