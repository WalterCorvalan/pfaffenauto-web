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

## No tocar sin revisar el resto

- No insertar en `alertas` sin pasar por `crearAlerta()` — te salteás los 2 filtros de arriba.
- Los cron jobs de `app/api/cron/panel-v2/` (`seguimientos`, `mi-resumen`, `mi-resumen-semanal`, `resumen-empresa`, `espacio-recordatorios`, `eventos`) son la fuente principal de alertas generadas automáticamente — ver sus propios comentarios de cabecera para qué cubre cada uno y con qué frecuencia corre (`migraciones/sql_cron_*.sql`).
