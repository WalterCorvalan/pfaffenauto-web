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
- **Visita nueva** (`app/api/panel/visitas/route.ts`): avisa al `vendedor_id` si vino asignado desde el formulario público, si no a admin/encargados.
- **Primera respuesta de un vendedor a un lead** (`app/api/panel/whatsapp/enviar/route.ts`, `app/api/panel/instagram/enviar/route.ts`): avisa a admin/encargados **solo cuando la conversación pasa de "sin_contactar" a "contactado"** (primera respuesta), no en cada mensaje de la charla — evita spam en una charla larga. Rodi no tiene endpoint de respuesta manual desde el panel (solo bot), así que no aplica ahí.
- **Reclamos** (`ReclamoDetalleModal.tsx`): "pedido de atención" avisa a los perfiles del sector elegido (o admin, si el pedido es "Admin"). **Bug corregido**: usaba `categoriaNotif: "pedidos_atencion_expedientes"` (la de Expedientes) en vez de `"reclamos"` — copiado del patrón de Expedientes sin cambiar la categoría. **Comentario nuevo** también avisa ahora al perfil asignado (si no es quien comenta) — antes solo quedaba en el timeline (`reclamo_seguimiento`), a pesar de que la categoría "Reclamos" de `NotificacionesTab.tsx` promete cubrir "comentarios" explícitamente.

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

## `lib/notificaciones.ts` (v1) — borrado, sus 4 automatizaciones reales se portaron a v2

Existía otro archivo, `lib/notificaciones.ts` (sin `panel/`), con funciones de mismo nombre (`notificarPersona`, `notificarEncargados`, `notificarGestoria`) pero que insertaban en una tabla v1 (`notificaciones`) que ningún componente del panel actual lee, y apuntaban a un proyecto Supabase distinto (`NEXT_PUBLIC_SUPABASE_URL`, no `NEXT_PUBLIC_SUPABASE2_URL` — otra base de datos, no solo otra tabla). Se borró junto con sus 8 call sites, la mayoría ya sin ningún uso real:

- `api/notificaciones/persona/route.ts` — sin ningún caller.
- `api/postulaciones/route.ts`, `api/visitas/route.ts`, `api/visitas/notificar/route.ts` — superados por sus equivalentes de panel (a los que ya apuntan los formularios públicos reales).
- `api/webhooks/wa/[token]`, `api/webhooks/ig/[token]` — superados por los webhooks de panel (los configurados en Meta).
- `api/vehiculos/notificar-cambio/route.ts` — sin ningún caller.
- `lib/tramites.ts` — otro archivo v1 (tabla `tramites_gestoria`, distinta de `expedientes`) que dependía de este, también sin ningún caller. Borrado junto.

La excepción fue `api/cron/automatizaciones/route.ts`: tenía 4 automatizaciones reales que **nunca se habían portado a v2** (a diferencia de "cuotas por vencer", que sí — ver `avisarCuotasPorVencer` en `seguimientos/route.ts`). Se reconstruyeron en `app/api/cron/panel/automatizaciones/route.ts`, corriendo cada 15 min (`migraciones/sql_cron_automatizaciones_panel_v2.sql`):

1. **Lead caliente sin atender 24h+**: si una conversación de WhatsApp calificada "caliente" no tiene respuesta interna en 24hs y no está en handoff, avisa al vendedor asignado (o a admin/encargados si no hay ninguno) — `categoriaNotif: "leads"`.
2. **Agradecimiento post-venta por WhatsApp**: 1-3hs después de cerrar una venta, manda un mensaje de agradecimiento al comprador (requiere `whatsapp_configuracion` cargada).
3. **Nudge de silencio**: si pasaron 30-45 min desde nuestro último mensaje sin que el cliente responda (y no está en handoff), manda un mensaje ofreciendo más info — el mensaje queda logueado en `whatsapp_mensajes` como cualquier otro.
4. **Documentación pendiente 5+ días en un expediente**: usa `expediente_checklist` (no `documentacion_ventas`, que era la tabla v1 — en v2 los documentos de una operación viven en el checklist del expediente) — avisa al gestor asignado o a admin/encargado/gestoría, `categoriaNotif: "expedientes"`.

El dedup es un flag boolean por fila (`aviso_caliente_sin_atender_enviado`, `aviso_agradecimiento_enviado`, `aviso_nudge_enviado`, `aviso_doc_pendiente_enviado` — ver la migración de columnas), mismo patrón que el resto de `seguimientos/route.ts`, no la tabla `automatizaciones_wa` aparte que usaba v1.

**Relevamiento completo del resto del código v1** (rutas que apuntaban a `NEXT_PUBLIC_SUPABASE_URL` en vez de `NEXT_PUBLIC_SUPABASE2_URL`), verificado por conexión real (quién llama a qué endpoint), no por el nombre de la ruta:

- **Borrado, sin ningún caller real** (confirmado con `grep` de quién hace `fetch()` a cada uno, y siguiendo cada `ChatClient.tsx`/`UsuariosClient.tsx`/formulario público hasta su endpoint real): `api/usuarios`, `api/vehiculos/crear-incompleto`, `api/vehiculos/reactivar-leads`, `api/vehiculos/reservar`, `api/ocr-dni`, `api/upload`, `api/upload-documento`, `api/upload-bunny` (y `components/UploaderVehiculo.tsx`, su único llamador, también sin uso), `api/upload-avatar`, `api/ventas/agradecimiento`, `api/panel/whatsapp/enviar` y `api/panel/instagram/enviar` (confirmado: `ChatClient.tsx` usa `api/panel/whatsapp/enviar` / `api/panel/instagram/enviar`, no estas). De paso, `lib/ai/agente.ts`, `lib/ai/index.ts`, `lib/ai/costoTracker.ts`, `lib/ai/usageLogger.ts` quedaron sin ningún caller (v2 tiene su propio `lib/ai/indexV2.ts`/`agenteV2.ts` en paralelo, no comparten código).
- **`lib/logger.ts` no es de esta lista** — a pesar de vivir junto a los archivos v1 de arriba, lo importan rutas de panel reales (`api/panel/busquedas`, `api/panel/upload`, entre otras) — no borrar.
- **Portado, no borrado**: `api/cron/pautas/route.ts` (sincronizaba gasto/clics/leads de Meta Ads, Google Ads y MercadoLibre hacia `campanas_marketing`) apuntaba a la base vieja, mientras que `/panel/marketing/pautas` (real, v2) lee `campanas_marketing` de la base nueva — a diferencia de los de arriba, esta sí era una función activa que nunca llegaba a donde tenía que llegar, no código muerto. Portado a `app/api/cron/panel/pautas/route.ts` (mismo `lib/ads/*.ts`, que ya recibía el cliente de Supabase como parámetro — el único cambio real fue el proyecto), cron cada 2hs (`migraciones/sql_cron_pautas_panel_v2.sql`).

## Alertas de "resumen" — "Ver más" abre un modal, no navega directo

`mi-resumen`, `mi-resumen-semanal` y `resumen-empresa` (los 3 cron jobs de arriba) arman todo el resumen en el propio `mensaje` de la alerta (varias líneas con `\n`), pero antes "Ver más" navegaba directo al `link` (`/panel/mi-espacio?tab=...`, `/panel`) sin mostrar ese contenido — y aunque no navegaras, el `<p>` de la tarjeta tampoco respetaba los `\n`, así que el resumen se veía todo pegado en una sola línea. `AlertasClient.tsx` ahora detecta estos 3 `tipo` (`TIPOS_RESUMEN` en `components/panel/alertaMeta.tsx`) y en vez de `router.push()` abre un modal con el `mensaje` completo (`whitespace-pre-line`, respeta los saltos de línea) — el `link` queda como botón opcional dentro del modal, no como acción del clic. Si sumás un cron de resumen nuevo, agregá su `tipo` a `TIPOS_RESUMEN` para que se comporte igual.

De paso, esos 3 `tipo` (`mi_resumen_diario`, `mi_resumen_semanal`, `resumen_diario_empresa`) no estaban mapeados en `TIPO_ICON`/`TIPO_COLOR`/`TIPO_VER` de `alertaMeta.tsx` — solo existía la clave genérica `resumen`, que ningún `crearAlerta()` real usa — así que caían en el ícono/color por defecto. Se agregaron los 3.

## No tocar sin revisar el resto

- No insertar en `alertas` sin pasar por `crearAlerta()` — te salteás los 2 filtros de arriba.
- Los cron jobs de `app/api/cron/panel/` (`seguimientos`, `mi-resumen`, `mi-resumen-semanal`, `resumen-empresa`, `espacio-recordatorios`, `eventos`, `automatizaciones`) son la fuente principal de alertas generadas automáticamente — ver sus propios comentarios de cabecera para qué cubre cada uno y con qué frecuencia corre (`migraciones/sql_cron_*.sql`).
