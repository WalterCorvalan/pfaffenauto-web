# Pedidos — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Dos formas de entrada, un solo `vendedor_id`/`marca` con forma distinta

- **`NuevoPedidoModal.tsx`** (panel, `origen: "manual"`): `marca`/`modelo` separados y limpios, cargados por un vendedor.
- **`components/BuscadorFallBack.tsx`** (catálogo público, "¿No encontraste lo que buscabas?" → `POST /api/panel/pedidos`, `origen: "web"`): un solo campo de texto libre del visitante (`busqueda`) se guarda tal cual en `marca` (ej. `"Toyota Hilux 2020"`), sin `modelo` separado. **No asumas que `pedidos.marca` es siempre un nombre de marca real** — para los de origen `"web"` puede ser cualquier texto que haya escrito el visitante.
- **`components/forms/VenderForm.tsx`** (`/vender`) va a `leads_tasacion`, no a `pedidos` — son dos tablas distintas para dos cosas distintas (alguien que quiere vender su auto vs. alguien que busca comprar uno).

## Match automático — `app/api/cron/panel/pedidos-match/route.ts`

`vehiculo_match_id`/`match_detectado_at` existían en la tabla pero **nada los seteaba solo** — un vendedor tenía que abrir el pedido y elegir manualmente un vehículo de un dropdown (`asignarMatchManual` en `PedidosClient.tsx`). Se agregó un cron (por hora, `migraciones/sql_cron_pedidos_match.sql`) que:

1. Trae `pedidos` con `estado: "activo"`, `vehiculo_match_id` nulo y `gestion_finalizada: false`.
2. Trae `vehiculos` con `estado: "disponible"`.
3. Matchea por substring de marca+modelo normalizado (`normalizarMarca()`, mismo criterio que el catálogo público), rango de año si se cargó, y precio vs. presupuesto **solo si las monedas coinciden** — sin cotización cargada acá, no se inventa una conversión, se deja pasar el filtro de precio en vez de descartar a ciegas (mismo espíritu que `lib/moneda.ts`).
4. Al matchear: setea `vehiculo_match_id`/`match_detectado_at` y avisa por `crearAlerta` (categoría `pedidos_wishlist`) al `vendedor_id` del pedido, o a admin/encargado/ventas disponibles si no tiene nadie asignado.

**El match es best-effort para los pedidos de origen `"web"`** (texto libre, ver arriba) — puede no encontrar nada si el visitante no escribió una marca real ("auto barato", "algo económico"), pero nunca genera un falso positivo grave: si no matchea, no hace nada, y el pedido sigue esperando revisión manual como antes.

## Sin WhatsApp automático al cliente — limitación real, no técnica

El aviso del match llega **al vendedor** (alerta interna), no al cliente por WhatsApp. Mandar un mensaje de WhatsApp Business fuera de la ventana de 24h de conversación requiere una plantilla pre-aprobada por Meta (`lib/panel/whatsappTemplates.ts`) — no hay ninguna armada para este caso todavía. Si se arma una plantilla y se aprueba, ahí sí se puede sumar el envío automático al cliente en este mismo cron.

## Nota de seguridad pendiente (no de este módulo, pero se vio de paso)

`migraciones/sql_cron_seguimientos_y_resumen_empresa.sql` tiene el valor real de `CRON_SECRET` commiteado en texto plano en la URL de `net.http_get`. `sql_cron_pedidos_match.sql` no repite ese error a propósito (deja `<CRON_SECRET>` como placeholder) — vale la pena rotar ese secreto en algún momento ya que quedó expuesto en el historial del repo.

## Cron jobs duplicados en `cron.job` (pendiente de limpieza, no tocar sin avisar)

`migraciones/sql_cron_setup_completo.sql` (armado en otra sesión, sin ver qué había en Supabase) creó un segundo juego de jobs (`panel-eventos`, `panel-pautas`, `panel-pedidos-match`, etc., ids ≥25) que duplica exactamente a los que ya existían con nombre `panel-v2-*` (ids 7-12, 21-22) — mismos endpoints, mismo `CRON_SECRET`, corriendo dos veces cada uno. Además hay dos jobs viejos que apuntan a endpoints que ya no existen en el código (`bono-tier-mensual`, `lead-routing`, ids 13-14) y dos rotos que nunca tuvieron el secreto bien cargado (`panel-v2-pedidos-match` id 23 con `<CRON_SECRET>` literal, `cheques-depositar-diario` id 24 con `'TU_CRON_SECRET'` literal). Nada de esto se borró todavía — pendiente de decidir con el dueño cuál de los dos juegos (`panel-v2-*` o el nuevo) se queda antes de sacar el otro.
