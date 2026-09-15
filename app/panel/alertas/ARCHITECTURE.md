# Alertas — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## `crearAlerta()` — único punto de escritura

Todo el panel crea alertas a través de `lib/panel/alertas.ts` → `crearAlerta(supabase, destinatarioId, titulo, opciones)`, nunca insertando directo en `alertas`. Dos filtros opcionales antes de insertar:

- `opciones.modulo`: no manda la alerta si el destinatario tiene ese módulo apagado (`visibilidad_sector`).
- `opciones.categoriaNotif`: no manda la alerta si el destinatario apagó esa categoría en Mi Espacio → Notificaciones (`espacio_notif_prefs.desactivadas`).

Si agregás un `crearAlerta()` nuevo para algo que ya tiene una categoría en `NotificacionesTab.tsx` (`ITEMS`), pasale `categoriaNotif` — si no, el usuario puede "apagar" esa categoría en la pantalla y seguir recibiéndola igual (bug real, pasó con "Tarea vencida" en `seguimientos/route.ts`: las otras 9 alertas del mismo archivo sí pasaban `categoriaNotif`, esa una no).

## `contador` — agrupar alertas repetidas

`AlertasClient.tsx` y `NotificationBell.tsx` muestran un badge "x3" cuando la misma alerta se repitió. La tabla `alertas` **no** tiene una columna `contador` ni dedup en el insert — cada `crearAlerta()` es una fila nueva. El agrupado es 100% client-side, vía `lib/panel/agruparAlertas.ts` (agrupa por `tipo + titulo`, conserva la fila más reciente como representante y junta los demás `id` en `idsGrupo`).

**Si tocás `marcarLeida`/`cerrarAlerta`/`abrirAlerta` en cualquiera de las 2 vistas, operá sobre `idsGrupo` (todas las filas del grupo), no sobre `a.id`** — si no, marcar como leída o borrar una alerta agrupada solo afecta a la más reciente y las duplicadas viejas quedan huérfanas (esto fue exactamente el bug: `contador` se mostraba mal porque nunca se calculaba, y antes de esta agrupación cada duplicado ni siquiera se distinguía).

## Notificaciones "en el momento" (no cron) — a quién avisan

Además de los cron jobs, algunas pantallas avisan apenas pasa algo, sin esperar al día siguiente:

- **Cotización nueva** (`NuevaCotizacionModal.tsx`), **consignación nueva** (`NuevaConsignacionModal.tsx`), **pedido nuevo** (`NuevoPedidoModal.tsx`): avisan a **admin/encargados** (`perfiles` con rol `admin` o `encargado`, excluyendo a quien lo creó) — no al creador. (Bug corregido: cotización nueva notificaba a `miId`, el mismo vendedor que la acababa de crear.)
- **Visita nueva** (`app/api/panel-v2/visitas/route.ts`): avisa al `vendedor_id` si vino asignado desde el formulario público, si no a admin/encargados.
- **Primera respuesta de un vendedor a un lead** (`app/api/panel-v2/whatsapp/enviar/route.ts`, `app/api/panel-v2/instagram/enviar/route.ts`): avisa a admin/encargados **solo cuando la conversación pasa de "sin_contactar" a "contactado"** (primera respuesta), no en cada mensaje de la charla — evita spam en una charla larga. Rodi no tiene endpoint de respuesta manual desde el panel (solo bot), así que no aplica ahí.

Si agregás un aviso "en el momento" nuevo para algo que un staff crea manualmente (no un lead público), seguí el patrón de cotización/consignación/pedido: avisar a admin/encargados, no al creador — y filtrar `.neq("id", miId)` para no auto-notificarse.

## `lib/panel/notificaciones.ts` — ahora pasa por `crearAlerta()` (bug corregido)

Este archivo (`notificarPersona`, `notificarEncargados`, `notificarVendedoresDisponibles`, `notificarGestoria`, `notificarFinanzas`, `notificarRespuestaPrecio`) insertaba directo en `alertas`, saltándose los dos filtros de `crearAlerta()` de arriba — en la práctica, un usuario podía apagar "Gestoría", "Finanzas" o "Leads" en Mi Espacio → Notificaciones y seguir recibiendo estas alertas igual. Corregido: cada función ahora llama a `crearAlerta()` internamente (una vez por destinatario), con un parámetro `opciones?: { categoriaNotif, modulo, prioridad }` opcional para que quien la llama pase la categoría/módulo que le corresponda.

Mapeo aplicado en los 7 call sites reales (todos los que importan de `@/lib/panel/notificaciones`, no confundir con `lib/notificaciones.ts`, ver abajo):
- Handoff de lead a vendedor/encargados (webhooks de WhatsApp y Rodi) → `categoriaNotif: "leads"`, `modulo: "leads"`.
- Conflicto de horario de visita (mismos dos webhooks) → sin `categoriaNotif` (no existe una categoría "visitas" en `NotificacionesTab.tsx` todavía), solo `modulo: "visitas"`.
- Presupuesto nuevo sin confirmar / respuesta de precio (`NuevoPresupuestoModal.tsx`, `ImprimirPresupuesto.tsx`) → `categoriaNotif: "taller"` (esa categoría describe explícitamente "presupuesto que pidió un vendedor... cuando el cliente aprueba o rechaza el presupuesto"), `modulo: "presupuestos"`.
- Seña sin confirmar / respuesta de precio (`NuevaSenaModal.tsx`, `ImprimirSena.tsx`) → sin `categoriaNotif` (no existe una categoría "señas"), solo `modulo: "senas"`.
- `notificarGestoria()`/`notificarFinanzas()` (usadas desde `TransferenciaModal.tsx` de Liquidaciones) → hardcodeado `categoriaNotif`/`modulo` = `"gestoria"`/`"finanzas"` dentro de la función misma, ya que esas dos funciones siempre son para ese destinatario.

Si agregás un call site nuevo a cualquiera de estas funciones, pasale `categoriaNotif`/`modulo` si hay una categoría real que le corresponda — si no hay ninguna que encaje, mejor dejarlo sin categoría (como visitas/señas arriba) que forzar una que no es.

## `lib/notificaciones.ts` (sin `panel/`) — archivo v1 legacy, probablemente código muerto

Ojo con no confundirlo con el de arriba: `lib/notificaciones.ts` (sin `panel/` en la ruta) es otro archivo distinto, con funciones de mismo nombre (`notificarPersona`, `notificarEncargados`, `notificarGestoria`) pero que **insertan en la tabla `notificaciones`** (v1, no `alertas`) y consultan `perfiles.rol` (columna singular vieja, no `perfiles.roles` array que usa el resto del sistema). Lo importan `api/cron/automatizaciones/route.ts`, `api/visitas/route.ts`, `api/visitas/notificar/route.ts`, `api/postulaciones/route.ts`, `api/notificaciones/persona/route.ts`, `api/vehiculos/notificar-cambio/route.ts`, y los webhooks legacy `api/webhooks/wa/[token]` / `api/webhooks/ig/[token]`.

Ningún componente del panel (`AlertasClient.tsx`, `NotificationBell.tsx`) lee la tabla `notificaciones` — solo leen `alertas`. Esto sugiere que estos ~8 call sites no le llegan a nadie hoy (aunque no se confirmó si `perfiles.rol` todavía existe en la base o si esas queries ya fallan silenciosamente). No se tocó en esta pasada — es un hallazgo aparte, más grande (decidir si migrar estos call sites a `lib/panel/notificaciones.ts`/`crearAlerta()`, o si son rutas realmente muertas y conviene borrarlas, requiere confirmar primero si siguen recibiendo tráfico real).

## No tocar sin revisar el resto

- No insertar en `alertas` sin pasar por `crearAlerta()` — te salteás los 2 filtros de arriba.
- Los cron jobs de `app/api/cron/panel-v2/` (`seguimientos`, `mi-resumen`, `mi-resumen-semanal`, `resumen-empresa`, `espacio-recordatorios`, `eventos`) son la fuente principal de alertas generadas automáticamente — ver sus propios comentarios de cabecera para qué cubre cada uno y con qué frecuencia corre (`migraciones/sql_cron_*.sql`).
