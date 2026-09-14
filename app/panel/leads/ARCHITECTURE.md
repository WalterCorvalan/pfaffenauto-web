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

## `tareas_lead`

Puede colgar de cualquiera de las 4 fuentes vía FK: `whatsapp_conversacion_id`, `instagram_conversacion_id`, `rodi_conversacion_id`, `leads_manuales_id` (exactamente una no-nula por fila). El mapeo canal → columna FK está en `app/panel/whatsapp/LeadDetailModal.tsx` (const con las 4 claves) — reusar ese mapeo en vez de hardcodear el nombre de columna en un lugar nuevo.

## Links a detalle

- whatsapp/instagram abren en `/panel/whatsapp?tab=leads&lead=<id>&origen=<origen>` (`ConversacionesShell.tsx`, scopeado a esos 2 canales).
- rodi/manual abren en `/panel/leads?lead=<id>&origen=<origen>` (la vista unificada, la única que resuelve los 4 orígenes).

## No tocar sin revisar el resto

- No agregar un 5° canal de leads sin actualizar los 3 lugares de arriba (unificación en `leads/page.tsx`, el mapeo FK de `tareas_lead`, y cualquier contador tipo "Leads sin atender").
