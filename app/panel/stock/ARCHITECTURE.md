# Stock — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Tabla principal

`public.vehiculos`. Campos clave para no confundir:

- `estado`: `disponible` / `reservado` / `señado` / `vendido` / `en_preparacion`. **Esto es lo único que mira el catálogo público** para decidir qué mostrar (filtra `in (disponible, reservado)`).
- `publicado_ml`: boolean — si el vehículo está sincronizado con **MercadoLibre**. No tiene relación con la visibilidad en el catálogo propio. El badge "% publicado" y el filtro "A revisar" del panel miden esto (aclarado con labels "en ML" desde el fix P1-17, porque antes confundía: podía decir "0% publicado" con 73 autos visibles en `/catalogo`).
- `condicion`: `0km` / `Excelente` / `Muy bueno` / `Bueno` / `Regular`. Es la **única** fuente real de "0KM vs usado" — nunca derivarlo de `km === 0` ni del año del vehículo: muchos usados tienen el km sin cargar (queda en 0/null por defecto, sin ser 0km real). Bug corregido en 7 lugares distintos (recibo de Seña P1-13, catálogo público, página `/0km`, buscador con IA, comparador, showroom 3D, y la publicación a MercadoLibre — este último publicaba usados como "Nuevo"). Si agregás un lugar nuevo que necesite saber si un auto es 0km, usá siempre `condicion === "0km"`.
- `sucursal_id`, `radicado_localidad`, `radicado_provincia`: usados por los recibos de venta/seña para mostrar de dónde es el vehículo.
- `precio_publicado_ars` / `precio_publicado_usd`: precio que se muestra en el catálogo público — puede diferir de `precio_venta` (precio interno de referencia).

## Componentes

- **`StockClient.tsx`** — listado/tabla principal. `aRevisar(v)` = `!v.publicado_ml || v.fotos.length === 0 || !v.precio_venta` (criterio de sincronización con ML, no de "listo para vender"). Tiene 3 vistas intercambiables sobre la misma lista ya filtrada/ordenada (`filtrados`/`paginados`): `"lista"` (fila compacta), `"tarjetas"` (grid de cards), `"tabla"` (la tabla completa vía `TablaResponsiva`, la única con acciones inline de editar/señar/eliminar y columnas de ML/asignado). El selector de orden (`orden`) es real, no cosmético: ordena `filtrados` antes de paginar. "Coincidencias de unidad/modelo" y el checkbox "Comparar" que aparecen en el mockup de referencia **no están implementados** (no hay feature de comparador en el panel) — no agregar ese texto/checkbox sin construir la funcionalidad real detrás, para no repetir el patrón de "label sin datos reales" que ya se corrigió varias veces en otros módulos.
- **`BotonPublicarML.tsx`** — dispara la publicación a MercadoLibre, actualiza `publicado_ml`, `ml_item_id`, `ml_publicar_error`.
- **`NuevoVehiculoModal.tsx`** / edición inline (`PrecioEditor.tsx`, `SucursalEditor.tsx`, `VendedorEditor.tsx`).
- **`NuevoMandatoModal.tsx`** — vehículos consignados (mandato), tabla `mandatos` aparte con FK a `vehiculos`.
- **`ImportarXlsxModal.tsx`** — carga masiva.

## Componente compartido usado DESDE otros módulos

- **`components/panel/VehiculoSelector.tsx`** — no vive en `stock/`, pero opera sobre la misma tabla `vehiculos` y lo usan Señas, Ventas, Presupuestos y Permutas para elegir/cargar un vehículo. Si agregás una columna nueva a `vehiculos` que otros formularios necesiten leer, decidí si va acá (afecta a los 4 consumidores) o se resuelve en cada consumidor con su propio query/join, como se hizo con `condicion` en el recibo de seña.

## Conexión con Leads — consultas por WhatsApp de un auto publicado en ML

`vehiculos.ml_item_id` (formato `"MLA<dígitos>"`) también se usa para vincular automáticamente una conversación de WhatsApp con el auto por el que preguntan: cuando alguien escribe desde el botón "Contactá al vendedor" de la publicación en MercadoLibre, el webhook de WhatsApp (`app/api/panel/webhooks/whatsapp/[token]/route.ts`) busca el `MLA...` en el texto del primer mensaje, lo cruza contra `ml_item_id`, y si matchea le setea `whatsapp_conversaciones.vehiculo_id` — ver `app/panel/leads/ARCHITECTURE.md`. `NuevoVehiculoModal.tsx` muestra el conteo ("💬 N consultas por WhatsApp") contando `whatsapp_conversaciones` con ese `vehiculo_id`.

## Conexión con el catálogo público

- El catálogo (`app/(public)/catalogo/`) hace sus propios queries a `vehiculos` — no reusa nada de `StockClient.tsx`. Ver `app/(public)/catalogo/ARCHITECTURE.md`.
- Columnas expuestas al público: `lib/vehiculos.ts` → `CAMPOS_VEHICULO_PUBLICO`. **Nunca** usar `select("*")` en queries públicas — hay columnas internas (`precio_compra`, `precio_costo_ars/usd`, `observaciones_internas`, `vendedor_asignado_id`) que no deben viajar al cliente.

## `ubicacion` — se carga vacío a propósito, tiene que ser nullable

`vehiculos.ubicacion` se deja vacío al cargar un auto nuevo (se completa después, no es obligatorio en el alta). `NuevoVehiculoModal.tsx` ya manda `ubicacion: ubicacion || null`, pero la columna tenía una restricción `NOT NULL` en la base que lo rechazaba (`sql_vehiculos_ubicacion_nullable.sql` la saca). Si volvés a ver `null value in column "ubicacion" ... violates not-null constraint`, es porque esa migración no se corrió, no porque el formulario esté mal.

## Color de marca — piloto de rebrand rojo→azul (#0145F2)

`StockClient.tsx` mezclaba `rose-600` para dos cosas distintas: acentos de marca (icono del título, botones "Nuevo vehículo"/"Nuevo mandato", tab activo, chips de filtro/vista seleccionados, foco del buscador) y señales reales de estado/peligro (botón eliminar, badge "Vencido" de mandato, texto de días vencidos, punto+borde de fila estancada +60d). Se recoloreó solo el primer grupo a `#0145F2` (el azul ya definido como `colors.primary` en `tailwind.config.ts` pero no usado en literal), dejando el segundo grupo en rojo a propósito — no es el mismo `rose-600`, es información real (algo está vencido/hay que eliminar).

Este fue el **piloto** de un pedido más amplio (cambiar rojo→azul en todo el panel). El resto del panel ya se migró con el mismo criterio (~155 archivos adicionales, ver commit de "rebrand rojo→azul — resto del panel"). Notas para si se retoca algo de esto:

- Solo `rose-600`/`rose-700` (botones/tabs/chips sólidos) se migraron a `#0145F2`/`#0138c9`. `rose-500`, `rose-50`, `rose-100`, `rose-200`, `rose-400` **no se tocaron** — son mayormente badges de estado ("Vencido", "+60 días", puntos de leyenda) donde cambiar solo un tono del par bg/text hubiera dejado combinaciones raras (ej. texto azul sobre fondo rosa). Si vas a migrar alguno de estos, revisá el par bg+text completo, no un tono aislado.
- Dos archivos quedaron **sin tocar a propósito** porque son mapas de color por categoría/severidad, no botones de acción: `components/panel/TarjetaCostoIA.tsx` (tono `rose` = "costo de IA alto", nivel de alerta) y `components/panel/alertaMeta.tsx` (`TIPO_COLOR`, un color por tipo de notificación — cambiar uno rompía la combinación bg/text del badge). Mismo criterio para `components/panel/TopTicker.tsx` (el trofeo de ventas usa `bg-rose-100` + ícono, cambiar solo el ícono dejaba fondo rosa con ícono azul).
- Donde el acento sí se migró, el patrón `dark:text-rose-400` que acompañaba al `text-rose-600` original se cambió a `dark:text-[#5b8dff]` (azul más claro, pensado para fondo oscuro) — si agregás un acento nuevo, no dejes el modo oscuro en rojo mientras el claro queda azul.
- El botón "Cerrar sesión" y el toast de alertas nuevas (`app/panel/layout.tsx`) se dejaron en rojo a propósito — no son acciones primarias de guardar/crear.

## Vista por default: "lista", no "tabla"

`vista` (el toggle Lista/Tarjetas/Tabla detallada) arranca en `"lista"` — pedido explícito, antes abría en `"tabla"`. Si cambiás el default de nuevo, hacelo a propósito y avisá, porque `app/panel/clientes/ARCHITECTURE.md` usa esta misma vista "lista" como referencia de diseño para otras pantallas del panel.

## No tocar sin revisar el resto

- No confundir `publicado_ml` con "visible en la web" en ningún indicador nuevo — son conceptos distintos y ya generó un hallazgo de auditoría por la confusión.
- `normalizarMarca()` (en `lib/vehiculos.ts`) es la utilidad compartida para deduplicar marcas por variantes de tildes/mayúsculas (usada en el home y en el filtro de marcas del catálogo) — reusarla en vez de comparar strings de marca directamente.
