# Leads — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Las 4 fuentes — no hay una tabla "leads"

Un lead **no** vive en una sola tabla. Vive en una de estas 4, según el canal:

- `whatsapp_conversaciones`
- `instagram_conversaciones`
- `rodi_conversaciones`
- `leads_manuales`

Cada una tiene su propio `estado_lead` (`nuevo`/`asignado`/`calificando`/`convertido`/`perdido`, default `"nuevo"`), `calificacion`, `vendedor_id`, `canal_origen`, `sucursal_id`. `app/panel/leads/page.tsx` (`LeadsUnificadosClient.tsx`) es la **única** vista que unifica las 4 en una sola lista — cualquier pantalla nueva que necesite "todos los leads" tiene que consultar las 4, no una o dos.

**Este patrón ya generó 2 bugs de auditoría por quedarse corto:**
- El tile "Leads sin atender" del Dashboard general contaba `clientes` en vez de leads con `estado_lead = "nuevo"` en las 4 tablas (corregido).
- El tablero de Tareas de Leads (`app/panel/tareas/page.tsx`) solo hacía join con whatsapp/instagram — una tarea asignada sobre un lead de Rodi o manual desaparecía del tablero por completo, no solo de un contador (corregido).

Si agregás una pantalla o métrica nueva sobre "leads", contá/consultá las 4 tablas o reusá `LeadsUnificadosClient.tsx`/su patrón de normalización — nunca asumas que whatsapp+instagram alcanza.

## `canal_origen` — de dónde vino el lead

- **`leads_manuales`**: `canal_origen` es texto libre que carga quien lo crea a mano.
- **`leads_tasacion`** (Cotizador/Vender/Financiación, sitio público): se llena con `getCanalOrigen()` (`lib/utm.ts`) — lee `utm_source` de la URL o, si no hay, el dominio del `document.referrer`. Vocabulario: `"Google Ads"`, `"Meta Ads"` (facebook e instagram mapean los dos ahí), `"MercadoLibre"`, `"WhatsApp"`, o la variante `"(orgánico)"` de cada uno si no hay UTM y detectó el referrer.
- **`whatsapp_conversaciones` / `instagram_conversaciones`**: Meta manda un objeto `referral` en el primer mensaje **solo** cuando la charla arrancó desde un anuncio de Click-to-WhatsApp/Instagram o el botón "Enviar mensaje" de un posteo/story — ahí `canal_origen` se clasifica como `"Meta Ads"` (mismo vocabulario que `lib/utm.ts`, ver los webhooks respectivos). Si no llega `referral` (mensaje orgánico, alguien tipeó el número/usuario a mano), `canal_origen` queda `null` — no hay forma de saber más sin ese dato (WhatsApp/Instagram no exponen otra señal). **Se setea una sola vez** (si ya tiene valor, no se pisa en mensajes posteriores).
- **`rodi_conversaciones`**: sin clasificación de `canal_origen` todavía (Rodi es el bot del sitio público propio, no tiene equivalente a `referral` de Meta).
- **MercadoLibre vía WhatsApp**: MELI tiene su propio sistema de mensajería, separado de WhatsApp — un comprador de MELI normalmente escribe por el chat de MELI, no por acá. Si en algún momento se pone un link de wa.me en la descripción de un aviso de MELI con un texto prearmado distintivo, hay que parsear ese texto en el webhook para clasificarlo — hoy no existe ese link, así que no hay forma de distinguir un lead de MELI que decide escribir por WhatsApp.

## `tareas_lead`

Puede colgar de cualquiera de las 4 fuentes vía FK: `whatsapp_conversacion_id`, `instagram_conversacion_id`, `rodi_conversacion_id`, `leads_manuales_id` (exactamente una no-nula por fila). El mapeo canal → columna FK está en `app/panel/whatsapp/LeadDetailModal.tsx` (const con las 4 claves) — reusar ese mapeo en vez de hardcodear el nombre de columna en un lugar nuevo.

## Links a detalle

- whatsapp/instagram abren en `/panel/whatsapp?tab=leads&lead=<id>&origen=<origen>` (`ConversacionesShell.tsx`, scopeado a esos 2 canales).
- rodi/manual abren en `/panel/leads?lead=<id>&origen=<origen>` (la vista unificada, la única que resuelve los 4 orígenes).

## No tocar sin revisar el resto

- No agregar un 5° canal de leads sin actualizar los 3 lugares de arriba (unificación en `leads/page.tsx`, el mapeo FK de `tareas_lead`, y cualquier contador tipo "Leads sin atender").
