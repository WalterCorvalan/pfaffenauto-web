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

## `lib/panel/notificaciones.ts` — sistema paralelo que bypasea las preferencias (deuda grande, no un bug de línea)

Existe un segundo archivo de helpers de notificación, `lib/panel/notificaciones.ts` (`notificarPersona`, `notificarEncargados`, `notificarVendedoresDisponibles`, `notificarGestoria`, `notificarFinanzas`, `notificarRespuestaPrecio`), heredado de v1 ("Equivalentes de lib/notificaciones.ts (v1)", según su propio comentario de cabecera). **Todas** sus funciones insertan directo en `alertas` sin pasar por `crearAlerta()` — violan la regla de arriba ("nunca insertar directo en alertas") en todo el archivo, no en un caso puntual.

Efecto real: ninguna alerta que pase por este archivo respeta ni el filtro de módulo apagado (`visibilidad_sector`) ni el de categoría desactivada en Mi Espacio → Notificaciones (`espacio_notif_prefs.desactivadas`) — un usuario puede apagar "Gestoría", "Finanzas" o "Leads" en esa pantalla y va a seguir recibiendo estas igual. Se usa en ~13 puntos: los webhooks de WhatsApp/Instagram/Rodi (handoff a vendedor, conflictos de horario de visita), `NuevoPresupuestoModal.tsx`/`ImprimirPresupuesto.tsx`, `NuevaSenaModal.tsx`/`ImprimirSena.tsx` (precio a confirmar), `TransferenciaModal.tsx` (Liquidaciones, notificarGestoria/notificarFinanzas), `api/visitas/*`, `api/postulaciones/route.ts`, `api/cron/automatizaciones/route.ts`.

Consecuencia colateral: varias categorías de `CategoriaNotif` (`lib/panel/alertas.ts`) y de `NotificacionesTab.tsx` — al menos `gestoria`, `cambios_precio`, `taller`, `gerente_ia`, `oportunidades_red`, `comisiones`, `fraude`, `suscripcion` — no tienen ningún `crearAlerta()` que les pase esa `categoriaNotif` (algunas porque el aviso real que les correspondería sale por este archivo paralelo en vez de por `crearAlerta()`, como `gestoria`/`finanzas` vía `notificarGestoria()`/`notificarFinanzas()`; otras probablemente porque esa alerta todavía no está implementada).

**No se resuelve con un cambio mínimo**: migrar esto implica revisar cada uno de los ~13 call sites, decidir el `categoriaNotif`/`modulo` correcto para cada aviso (no siempre es obvio — hay categorías sin un mapeo 1:1 claro, como "precio a confirmar" de señas), y reemplazar el insert directo por `crearAlerta()`. Encararlo como su propio proyecto con revisión caso por caso, no como parte de una auditoría de "nombre dice X, código hace Y".

## No tocar sin revisar el resto

- No insertar en `alertas` sin pasar por `crearAlerta()` — te salteás los 2 filtros de arriba.
- Los cron jobs de `app/api/cron/panel-v2/` (`seguimientos`, `mi-resumen`, `mi-resumen-semanal`, `resumen-empresa`, `espacio-recordatorios`, `eventos`) son la fuente principal de alertas generadas automáticamente — ver sus propios comentarios de cabecera para qué cubre cada uno y con qué frecuencia corre (`migraciones/sql_cron_*.sql`).
