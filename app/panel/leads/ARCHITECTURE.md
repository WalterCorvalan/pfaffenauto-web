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

Puede colgar de cualquiera de las 4 fuentes vía FK: `whatsapp_conversacion_id`, `instagram_conversacion_id`, `rodi_conversacion_id`, `leads_manuales_id` (exactamente una no-nula por fila). El mapeo canal → columna FK está en `components/panel/conversaciones/LeadDetailModal.tsx` (const con las 4 claves) — reusar ese mapeo en vez de hardcodear el nombre de columna en un lugar nuevo.

## Links a detalle

- whatsapp abre en `/panel/whatsapp?tab=leads&lead=<id>&origen=whatsapp`, instagram en `/panel/instagram?tab=leads&lead=<id>&origen=instagram` (cada módulo monta `ConversacionesShell.tsx` con su propio `backTo`, separados el 25/9 -- antes compartían una sola pantalla).
- rodi/manual abren en `/panel/leads?lead=<id>&origen=<origen>` (la vista unificada, la única que resuelve los 4 orígenes).

## Reparto de leads nuevos — `disponibilidad_vendedor`

Cuando entra un lead sin vendedor asignado (el "hola" inicial), `notificarVendedoresDisponibles()` (`lib/panel/notificaciones.ts`) avisa a todos los admin/encargado/ventas activos **excepto** los que tienen `disponibilidad_vendedor.recibir_leads = false` (vendedor de licencia/vacaciones que se sacó de la rotación desde `DisponibilidadModal.tsx`, en Clientes). Es el **único** lugar del código que lee `recibir_leads` para reparto — no hay otro camino de asignación que lo consulte.

**Bug corregido**: `DisponibilidadModal.tsx` le dice al vendedor "Volvés solo pasada la fecha 'hasta'", pero `notificarVendedoresDisponibles()` nunca chequeaba `hasta` — un vendedor que se sacó de la rotación por 2 semanas de vacaciones quedaba afuera para siempre hasta que alguien entrara a mano a destildar "Seguir recibiendo leads". Ahora la función también trae `hasta` y solo mantiene a alguien fuera de la rotación si `hasta` es hoy o una fecha futura (sin `hasta` cargada, sigue afuera indefinidamente — eso sí es el comportamiento esperado para "Ausente"/"Enfermo" sin fecha de vuelta conocida). No hay ningún cron que resetee `recibir_leads` a `true` en la base — el campo se queda en `false` para siempre, la fecha se ignora únicamente al decidir a quién notificar.

## El rol de vendedor es `"ventas"`, no `"vendedor"`

**Bug corregido**: `app/panel/leads/page.tsx` filtraba `vendedoresLista` con `roles?.includes("vendedor")` — ese rol no existe en ningún perfil, el string correcto usado en todo el resto del código (`whatsapp/page.tsx`, `rodi/page.tsx`, `nps/page.tsx`, `configuracion/empresa/EmpresaClient.tsx`, `reportes/page.tsx`, `notificarVendedoresDisponibles()`) es `"ventas"`. Con el string equivocado, la lista de vendedores que llega a `LeadsUnificadosClient.tsx` quedaba vacía salvo por los admin — rompía el nombre del vendedor asignado en el listado y el selector para asignar/crear leads manuales.

## Layout de dos paneles + pestañas "Sin respuesta" / "Lead basura"

`LeadsUnificadosClient.tsx` es un layout de dos paneles tipo `components/panel/conversaciones/ChatClient.tsx`: sidebar con la lista (izquierda) + `LeadDetailModal` renderizado **inline** (derecha), no como modal superpuesto. Para eso `LeadDetailModal.tsx` (compartido con `/panel/whatsapp` y `/panel/instagram`) tiene un prop `inline?: boolean` — la única diferencia es el wrapper: con `inline` devuelve el contenido pelado (sin overlay `fixed inset-0`); sin el prop se comporta exactamente igual que antes (modal). Si tocás el contenido del detalle, es el mismo componente en los dos módulos — no dupliques lógica acá.

`DIAS_SIN_RESPUESTA = 2` (constante en `LeadsUnificadosClient.tsx`) define el único umbral del módulo:

- **"Sin respuesta"**: leads `caliente`, no basura, cuyo último mensaje es del cliente (`direccion = "in"`) y pasaron ≥2 días sin respuesta nuestra, y no están `perdido`/`convertido`.
- **"Lead basura"**: mismo criterio de "2+ días sin contestar" pero para leads `frío`/sin calificar (regla automática, calculada en el cliente — no persiste nada), **más** cualquier lead con `es_basura = true` en la base (mandado a mano por un vendedor desde el botón del detalle, sin esperar el umbral).

La dirección del último mensaje **no vive en la fila de la conversación** — `app/panel/leads/page.tsx` la trae con `ultimaDireccionPorConversacion()`, un fetch en bloque (últimas 3000 filas, `order by created_at desc`) por cada tabla de mensajes (`whatsapp_mensajes`, `instagram_mensajes`, `rodi_mensajes`) reducido a `{conversacion_id: direccion}` client-side, en vez de una query por conversación. `leads_manuales` no tiene tabla de mensajes — queda afuera de las dos reglas automáticas (`ultimaDireccion: null` siempre), pero sí puede mandarse a basura a mano.

**`es_basura`** es una columna nueva (boolean, default `false`) en las 4 tablas de origen — el toggle vive en el header de `LeadDetailModal.tsx` (`toggleBasura`). Si en algún momento se agrega un 5° canal de leads, necesita esta columna también o quedará afuera de "Lead basura" manual.

**Migración pendiente**: `migraciones/sql_leads_es_basura.sql` agrega `es_basura` a las 4 tablas. Hasta que se corra en Supabase, el toggle "Lead basura" falla al guardar (columna inexistente) — la regla automática de basura para leads fríos sí funciona sin la migración porque no depende de esa columna.

## No tocar sin revisar el resto

- No agregar un 5° canal de leads sin actualizar los 3 lugares de arriba (unificación en `leads/page.tsx`, el mapeo FK de `tareas_lead`, y cualquier contador tipo "Leads sin atender") — y sin sumarle `es_basura` si tiene que participar de la pestaña "Lead basura".
- `LeadDetailModal.tsx` es compartido entre `/panel/whatsapp`, `/panel/instagram`, `/panel/rodi` y `/panel/leads` — cualquier cambio a su contenido (no al wrapper `inline`) afecta a los dos módulos.
