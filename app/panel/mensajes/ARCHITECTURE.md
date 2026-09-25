# Mensajes (chat interno) — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Tablas

`mensajes_canales` (`tipo`: `general` / `directo` / `grupo`), `mensajes_canal_miembros`, `mensajes`, `mensajes_lecturas` (para "no leídos", por canal y perfil), `mensajes_presencia` (heartbeat cada 20s para el punto verde de "en línea").

## No leídos y realtime — 100% dentro de este componente

`MensajesClient.tsx` calcula "no leídos" comparando `mensajes_lecturas.last_read_at` contra los mensajes nuevos que le llegan por Supabase Realtime (`postgres_changes` sobre `mensajes`). Esto solo funciona **mientras la pantalla de Mensajes está montada** — no hay badge en el sidebar ni nada fuera de este componente que lo refleje.

## Notificación cross-página (agregada 25/9) — solo directo/grupo, no "general"

Antes, si te mandaban un mensaje y no tenías la pantalla de Mensajes abierta en ese momento, no te enterabas de nada (cero campana, cero toast) — el módulo entero no generaba ninguna alerta real. `enviar()` ahora llama a `crearAlerta()` (`tipo: "nuevo_mensaje_interno"`, `modulo: "mensajes"`) para los demás miembros del canal, **excepto cuando el canal es `"general"`** (ahí son todos los usuarios activos — avisar de cada mensaje sería spam constante). Si agregás otro tipo de canal masivo, aplicá el mismo criterio: solo notificar en conversaciones acotadas (directo/grupo), no en canales tipo broadcast.

## No tocar sin revisar el resto

- Si cambiás cómo se arma `miembros` de un canal, revisá que el `crearAlerta()` de `enviar()` siga excluyendo al propio autor (`neq("perfil_id", miId)`) — si no, cada uno se auto-notifica su propio mensaje.
