# Leads — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Las 4 fuentes — no hay una tabla "leads"

Un lead **no** vive en una sola tabla. Vive en una de estas 4, según el canal:

- `whatsapp_conversaciones`
- `instagram_conversaciones`
- `rodi_conversaciones`
- `leads_manuales`

Cada una tiene su propio `estado_lead` (`nuevo`/`asignado`/`calificando`/`convertido`/`perdido`, default `"nuevo"`), `calificacion`, `vendedor_id`, `canal_origen`, `sucursal_id`. `app/panel/leads/page.tsx` (`LeadsUnificadosClient.tsx`) es la **única** vista que unifica las 4 en una sola lista — cualquier pantalla nueva que necesite "todos los leads" tiene que consultar las 4, no una o dos.

**Este patrón ya generó 4 bugs de auditoría por quedarse corto:**
- El tile "Leads sin atender" del Dashboard general contaba `clientes` en vez de leads con `estado_lead = "nuevo"` en las 4 tablas (corregido).
- El tablero de Tareas de Leads (`app/panel/tareas/page.tsx`) solo hacía join con whatsapp/instagram — una tarea asignada sobre un lead de Rodi o manual desaparecía del tablero por completo, no solo de un contador (corregido).
- "Tasa de cierre global" en Marketing → Generales (`app/panel/marketing/generales/page.tsx`) contaba `clientes` (todo el CRM, histórico) como si fuera "leads", mostrando un % que no tenía nada que ver con conversión real de leads (corregido: suma las 4 tablas, `estado_lead = "convertido"` para el numerador).
- Marketing → Embudo (`app/panel/marketing/embudo/page.tsx`) — el más grave de los cuatro: "Total Leads" del flujo, "Leads y cierres por canal" y "Rendimiento por Vendedor" contaban **toda la tabla `clientes`** del período, incluida la migración masiva de clientes del sistema viejo. Con esa migración de fondo llegó a mostrar ~1000 "leads" cuando en la realidad había 1 solo lead real de WhatsApp en el período (corregido: las 3 secciones usan las 4 tablas reales, `estado_lead` en vez de `pipeline_stage`, `canal_origen` en vez de `origen`). La sección "Cómo nos conocieron" del mismo módulo sí sigue usando `clientes` a propósito — es sobre altas manuales de mostrador (walk-in), un concepto legítimamente distinto de "lead" (ver más abajo). Recordatorio de negocio: un lead vive en una de las 4 tablas hasta que se **convierte** (compra o consignación completa) — recién ahí pasa a `clientes`; no son la misma entidad en ningún punto del ciclo.

Si agregás una pantalla o métrica nueva sobre "leads", contá/consultá las 4 tablas o reusá `LeadsUnificadosClient.tsx`/su patrón de normalización — nunca asumas que whatsapp+instagram alcanza.

## `canal_origen` — de dónde vino el lead

- **`leads_manuales`**: `canal_origen` es texto libre que carga quien lo crea a mano.
- **`leads_tasacion`** (Cotizador/Vender/Financiación, sitio público): se llena con `getCanalOrigen()` (`lib/utm.ts`) — lee `utm_source` de la URL o, si no hay, el dominio del `document.referrer`. Vocabulario: `"Google Ads"`, `"Meta Ads"` (facebook e instagram mapean los dos ahí), `"MercadoLibre"`, `"WhatsApp"`, o la variante `"(orgánico)"` de cada uno si no hay UTM y detectó el referrer.
- **`whatsapp_conversaciones` / `instagram_conversaciones`**: Meta manda un objeto `referral` en el primer mensaje **solo** cuando la charla arrancó desde un anuncio de Click-to-WhatsApp/Instagram o el botón "Enviar mensaje" de un posteo/story — ahí `canal_origen` se clasifica como `"Meta Ads"` (mismo vocabulario que `lib/utm.ts`, ver los webhooks respectivos). Si no llega `referral` (mensaje orgánico, alguien tipeó el número/usuario a mano), `canal_origen` queda `null` — no hay forma de saber más sin ese dato (WhatsApp/Instagram no exponen otra señal). **Se setea una sola vez** (si ya tiene valor, no se pisa en mensajes posteriores).
- **`rodi_conversaciones`**: sin clasificación de `canal_origen` todavía (Rodi es el bot del sitio público propio, no tiene equivalente a `referral` de Meta).
- **MercadoLibre vía WhatsApp**: el botón nativo "Contactá al vendedor" de una publicación de MELI (no algo que se configura a mano, es un CTA propio de MELI) genera un link `api.whatsapp.com/send` con un texto prearmado que **siempre** incluye el link completo de la publicación (`auto.mercadolibre.com.ar/MLA-...` o `articulo.mercadolibre.com.ar/MLA-...`). No manda `referral` como Meta Ads, pero el webhook detecta ese link en el texto del primer mensaje (`/mercadolibre\.com/i`) y clasifica `canal_origen = "MercadoLibre"`.

## `tareas_lead`

Puede colgar de cualquiera de las 4 fuentes vía FK: `whatsapp_conversacion_id`, `instagram_conversacion_id`, `rodi_conversacion_id`, `leads_manuales_id` (exactamente una no-nula por fila). El mapeo canal → columna FK está en `app/panel/whatsapp/LeadDetailModal.tsx` (const con las 4 claves) — reusar ese mapeo en vez de hardcodear el nombre de columna en un lugar nuevo.

## Links a detalle

- whatsapp/instagram abren en `/panel/whatsapp?tab=leads&lead=<id>&origen=<origen>` (`ConversacionesShell.tsx`, scopeado a esos 2 canales).
- rodi/manual abren en `/panel/leads?lead=<id>&origen=<origen>` (la vista unificada, la única que resuelve los 4 orígenes).

## No tocar sin revisar el resto

- No agregar un 5° canal de leads sin actualizar los 3 lugares de arriba (unificación en `leads/page.tsx`, el mapeo FK de `tareas_lead`, y cualquier contador tipo "Leads sin atender").
