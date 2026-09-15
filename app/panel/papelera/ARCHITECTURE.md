# Papelera — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Borrado lógico, no borrado real

`ventas`, `expedientes`, `clientes` y `taller_ordenes` tienen `deleted_at`/`deleted_by`/`motivo_eliminacion` (`migraciones/sql_papelera.sql`). "Eliminar" en cualquiera de esas pantallas ya no hace un `DELETE` real — hace un `UPDATE` seteando esas 3 columnas, vía `POST /api/panel-v2/papelera` (`accion: "eliminar"`). El endpoint es admin-only (mismo criterio que ya tenían las políticas `borrar_*` de esas tablas) y usa el cliente con `SUPABASE2_SERVICE_ROLE_KEY` (bypassa RLS), igual que `/api/panel-v2/modulos`.

**El resto del panel no se tocó.** El filtro de "esto está borrado, no lo muestres" vive en las políticas RLS de `SELECT` (`ver_ventas`, `ver_clientes`, `ver_expedientes`, `ver_ordenes` en `taller_ordenes`) — cada una ahora suma `and deleted_at is null` a su condición original. Así, los ~40 lugares del panel que ya leían estas tablas (Finanzas, Reportes, Dashboard, dropdowns de selección, etc.) dejan de ver lo eliminado automáticamente, sin que haya que auditar cada query uno por uno. Si agregás una columna o cambiás el criterio de "quién ve qué" en alguna de esas políticas, no le saques el `and deleted_at is null` que le agregó esta migración.

## `ventas` ↔ `expedientes` son 1:1 — se borran y restauran juntos

`expedientes.venta_id` es `unique`. En este negocio un expediente sin su venta (o una venta sin su expediente, si ya se generó uno) no tiene sentido, así que borrar cualquiera de los dos hace lo mismo: los dos quedan en la papelera juntos. Restaurar cualquiera de los dos los restaura a los dos. Esto vive en `parEncontrado()` dentro de `app/api/panel-v2/papelera/route.ts` — si necesitás romper ese acople para algún caso puntual, hacelo ahí, no en cada `Client.tsx`.

## `vehiculos.estado` se revierte con la venta

Al eliminar una venta (o su expediente): si el vehículo vinculado (`ventas.vehiculo_id`) está en `'vendido'`, pasa a `'disponible'`. Al restaurar: vuelve a `'vendido'` **solo si la venta restaurada tiene `estado === "cerrada"`** — mismo criterio que usa `NuevaVentaModal.tsx` para decidir si poner el vehículo en `'vendido'` al crearla (`vehiculoId && estadoFinal === "cerrada"`). Es simétrico a propósito: si al eliminar el vehículo no se tocó (porque no estaba `'vendido'`, ej. una venta no cerrada), restaurar tampoco lo tiene que tocar. **Bug corregido**: la primera versión de esto restauraba incondicionalmente a `'vendido'` sin chequear el estado de la venta — eliminar y restaurar una venta no cerrada (el vehículo nunca llegó a estar `'vendido'`) terminaba forzándolo a `'vendido'` igual, pisando su estado real (ej. `'reservado'`/`'señado'` de otra operación en curso sobre el mismo vehículo). Es una interpretación de "estado anterior" simplificada a propósito — no hay ninguna tabla que registre el estado exacto del vehículo antes de la venta, así que se asume `disponible` siempre al revertir una venta cerrada. Si en algún momento se necesita precisión ahí, hay que empezar a guardar el estado previo en algún lado (ej. una columna en `ventas` al crearla), esto no lo hace.

## `taller_ordenes` — columnas listas, sin flujo de borrado todavía

Se le agregaron las mismas 3 columnas por consistencia, y la pestaña "Órdenes de taller" existe en `PapeleraClient.tsx`, pero **`app/panel/taller/TallerClient.tsx` no tiene ningún botón para eliminar una orden** (el módulo Taller en sí todavía es un placeholder, ni siquiera lista las órdenes en tarjetas — ver el comentario "Listado de OTs (Próxima iteración)" en ese archivo). Esa pestaña de Papelera va a estar vacía siempre hasta que Taller tenga su propio flujo de eliminar. No es un bug.

## "Eliminar definitivamente" — sin rol de super-admin en este codebase

El pedido original distinguía "admin" (puede restaurar) de "super-admin" (puede borrar para siempre). Ese segundo rol no existe en `perfiles.roles` de este proyecto (solo hay `admin`/`encargado`/`ventas`/`finanzas`/`gestoria`) — se restringió `eliminar_definitivo` a `admin`, igual que ya estaban restringidas las políticas `borrar_ventas`/`borrar_expedientes`/`borrar_clientes` que reemplaza. Si en algún momento se agrega un rol más granular, `verificarAdmin()` en `app/api/panel-v2/papelera/route.ts` es el único lugar a tocar.

## No tocar sin revisar el resto

- El `motivo_eliminacion` es opcional (`prompt()` en cada `Client.tsx`, sin validación) — no lo hagas obligatorio sin avisar, el pedido original lo describe como opcional ("el motivo si lo dejaron").
- `PapeleraClient.tsx` pide `/api/panel-v2/papelera` sin `tipo` para los conteos de los chips y con `tipo` para el listado — son dos formas de la misma GET, no dos endpoints.
