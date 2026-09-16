# Comisiones — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Tabla principal

`public.comisiones` — cada fila es una comisión a favor de un beneficiario (vendedor, consignación, bono). `tipo`: `vendedor` / `vendedor_compartido` / `consignacion` / `bono`. `monto`/`moneda`, `monto_pagado`, `estado` (`pendiente`/`cobrada`), `aprobacion_pendiente` (solo para bonos pedidos por no-admin).

**Las filas de tipo `vendedor`/`vendedor_compartido`/`consignacion` las genera el trigger de base `generar_comisiones_al_cerrar_venta()` al cerrar una venta** (no está en este repo — ver `ventas/ARCHITECTURE.md`, sección de la comisión de consignación "fantasma"). Las de tipo `bono` las crea `crear_bono_comision()` vía `BonoModal.tsx`, manual.

## RPCs (no están en este repo, solo se llaman desde el cliente)

- `crear_bono_comision(p_beneficiario_id, p_concepto, p_monto, p_moneda)` — inserta una comisión tipo `bono`. Si quien llama no es admin/finanzas, la fila queda con `aprobacion_pendiente = true` y se notifica a admin/finanzas.
- `marcar_comision_cobrada(p_comision_id, p_forzar_sin_resena, p_cuenta_id?)` — pasa `estado` a `cobrada`, debitando `p_cuenta_id` (una cuenta real de Tesorería) cuando se paga el saldo completo de una.
- `cambiar_estado_comision(p_comision_id, p_nuevo_estado)` — usado para volver una comisión de `cobrada` a `pendiente`.
- `registrar_pago_parcial_comision(p_comision_id, p_monto, p_pago_externo, p_fecha, p_cuenta_id?)` — pago parcial (`PagoParcialModal.tsx`), gateado a `esAdminOFinanzas` en el cliente (único ícono de acción visible).

## Bug corregido (crítico): un vendedor podía pedirse un bono y auto-marcárselo cobrado sin aprobación real

`alternarEstado()` en `ComisionesClient.tsx` gatea correctamente la vuelta atrás (`cobrada` → `pendiente`, solo admin/finanzas), pero el camino de ida (`pendiente` → `cobrada`, el que efectivamente debita una cuenta real vía `p_cuenta_id`) **no tenía ningún gate de rol** — cualquier usuario que viera la fila podía clickear el badge de estado y marcarla cobrada. El badge "Pendiente Aprobación" (`c.aprobacion_pendiente`) era puramente decorativo, nada lo chequeaba antes de permitir la acción.

Combinado con `BonoModal.tsx` ("Pedir Comisión" fuerza `beneficiario_id = usuarioActualId` para no-admins), un vendedor podía: pedir un bono para sí mismo (queda `aprobacion_pendiente: true`) → sin que ningún admin interviniera → marcárselo cobrado él mismo, eligiendo de qué caja sale la plata. Cero validación real, más allá de un badge visual.

**Arreglado**: `alternarEstado()` ahora exige `esAdminOFinanzas` para el camino `pendiente → cobrada` completo (no solo para el caso de reseña faltante), simétrico con la vuelta atrás. Cualquier comisión — bono pedido o comisión de venta normal — solo la marca cobrada un admin/finanzas, igual que ya pasa con la reversión.

**De paso, corregido en la base** (`migraciones/sql_fix_crear_bono_comision_beneficiario.sql`, pendiente de correr): `crear_bono_comision()` tomaba `p_beneficiario_id` tal cual venía del caller sin validar server-side que coincidiera con `auth.uid()` para no-admins — el frontend ocultaba el selector, pero un llamado directo al RPC (no vía UI) podía pedir un bono a nombre de otro perfil. Ahora la función ignora el parámetro y usa siempre `auth.uid()` cuando quien llama no es admin/finanzas.

## No tocar sin revisar el resto

- Cualquier acción nueva que toque `estado`/`monto_pagado` de una comisión (o dispare un movimiento de caja) tiene que estar gateada a `esAdminOFinanzas` — es plata real saliendo de una cuenta, mismo criterio que `guardarComision()` en `VentaDetalleModal.tsx` (`ventas/ARCHITECTURE.md`).
- `sumaPorMoneda()` en `ComisionesClient.tsx` ya suma ARS/USD por separado para los KPIs — no sumar ambas monedas juntas si agregás un total nuevo.
