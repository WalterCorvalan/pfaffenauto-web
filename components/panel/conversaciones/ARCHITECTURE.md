# Conversaciones (WhatsApp/Instagram) — componentes compartidos

Guía para no romper otro módulo al tocar estos componentes. Antes vivían en
`app/panel/whatsapp/` como si fueran de un solo módulo, pero ya se usaban desde
`/panel/leads` y `/panel/rodi` (`LeadDetailModal.tsx`) -- el 25/9 se separaron
WhatsApp e Instagram en dos módulos de sidebar propios (antes compartían una
sola pantalla en `/panel/whatsapp` con un selector de canal adentro), así que
se movieron acá para reflejar que ya eran compartidos.

## Quién usa qué

- **`ConversacionesShell.tsx`**: contenedor con tabs (Bandeja/Leads/Nuevo mensaje). Lo montan `app/panel/whatsapp/page.tsx` (con `canalFijo="whatsapp"`) y `app/panel/instagram/page.tsx` (con `canalFijo="instagram"`).
- **`ChatClient.tsx`**: la bandeja de mensajes en sí. Con `canalFijo` seteado, arranca fijo en ese canal y oculta el switcher WhatsApp/Instagram interno (antes era la única forma de ver el otro canal, ahora cada canal tiene su propia URL).
- **`LeadsTab.tsx`**: vista de leads (grid/kanban/reportes) scopeada a los canales que le llegan por props. Acepta `backTo` (a dónde vuelve la URL al cerrar el detalle) — cada módulo pasa el suyo.
- **`LeadDetailModal.tsx`**: compartido por 4 módulos (`/panel/whatsapp`, `/panel/instagram`, `/panel/rodi`, `/panel/leads`) vía el prop `origen`. Ver `app/panel/leads/ARCHITECTURE.md` para el patrón de las 4 fuentes de leads.

## `canalFijo` — cómo separar sin duplicar código

En vez de duplicar `ChatClient`/`LeadsTab` para Instagram, ambos siguen
aceptando `conversacionesIniciales` (WhatsApp) y `conversacionesInstagramIniciales`
(Instagram) como props separadas -- cada `page.tsx` de módulo solo llena la
suya y pasa `[]` en la otra. `canalFijo` fuerza el estado inicial del switcher
interno de `ChatClient` y oculta los botones para cambiar de canal a mano. Si
en algún momento Messenger se conecta de verdad (ver
`app/panel/messenger/MessengerClient.tsx`), el patrón a seguir es sumar un
tercer par de props (`conversacionesMessengerIniciales` + `canalFijo="messenger"`)
en vez de reescribir estos componentes desde cero.

## No tocar sin revisar el resto

- Si cambiás el layout de tabs de `ConversacionesShell.tsx`, revisá los dos `page.tsx` que lo montan (whatsapp e instagram) -- ambos dependen del mismo shell.
- `LeadDetailModal.tsx` es el mismo componente en los 4 módulos que lo importan -- un cambio a su contenido (no al wrapper `inline`) los afecta a todos.
