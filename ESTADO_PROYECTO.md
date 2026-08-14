# Estado del Proyecto — Pfaffen Autos

Reporte de sesión larga de trabajo. Última actualización: 2026-08-14.

---

## 0. Reestructura de Operaciones (2026-08-14) — nuevo desde la última actualización

Se retiró el flujo unificado "Nueva Operación" (`ventas/nueva/VentaForm.tsx`, ya borrado) y se separó en 4 módulos independientes, cada uno con su propia carga/listado/impresión:

- **Presupuestos** (`/panel/presupuestos`), **Señas** (`/panel/senas`), **Ventas** (`/panel/boletos`, tabla `boletos_venta`), **Resp. Civil** (`/panel/resp-civil`) — 4 módulos completos, activando tablas legacy que existían en Supabase pero nunca se usaban.
- Componentes compartidos nuevos: `ClienteBuscador.tsx`, `VehiculoSelector.tsx` (buscar/crear cliente, elegir vehículo del stock o cargar manual).
- **Migración completa de todo lo que leía la vieja tabla `ventas`** a `boletos_venta`: Tesorería (`/panel/gastos`), Métricas, Liquidador de Sueldos, Postventa, Embudo de Marketing, Informes, Financiaciones, seguimiento por etapas + checklist de documentación (`documentacion_ventas`), tracker público (`/seguimiento/[codigo]`), agradecimiento automático por WhatsApp, venta rápida desde ficha de auto (`AccionesAuto.tsx`).
- Comisión del vendedor (`comision_ars`/`porcentaje_comision`) agregada a `boletos_venta`, calculada por % sobre venta_ars en el form.
- Probado end-to-end en browser con 2 boletos de prueba reales — 3 bugs encontrados y arreglados en la prueba: `fecha_nacimiento: ""` rompía alta de cliente (columna `date`), FK vieja en `documentacion_ventas`/`financiaciones` apuntando a `ventas` (rompía con 409 al guardar), `vehiculos.dominio` no existe — es `patente` (rompía Tesorería/Métricas, mostraban todo en $0 sin error visible).
- Tabla `ventas` y sus páginas de impresión histórica (`/panel/ventas/imprimir/[id]`) quedan intactas para no perder datos viejos, pero ya no reciben cargas nuevas.

---

## 1. Tareas Completadas

### Seguridad
- Uploads (`/api/upload`, `/api/upload-bunny`) ahora requieren sesión de staff logueada + límite 15MB + solo `image/*`.
- Rate limiting agregado (`lib/rateLimit.ts`, in-memory por IP) en: cotizaciones, visitas, chat, buscar-ia, upload-cotizacion.
- Headers de seguridad en `next.config.ts`: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. (CSP quedó pendiente, ver Backlog).
- Turnstile agregado a `AgendarVisitaForm.tsx` (antes insertaba directo a Supabase sin protección).
- `VenderForm.tsx` reescrito para funcionar exactamente igual que `ConsignarForm.tsx`: 3 pasos, Turnstile, pasa por `/api/cotizaciones` (rate-limited, server-side) en vez de insertar directo a Supabase con webhooks n8n hardcodeados sin protección.
- **CRÍTICO resuelto**: se sacó `select("*")` de las 7 páginas públicas que consultan `vehiculos` (home, catálogo listado, catálogo detalle, 0km, outlet, mundo-chino, marcas/[marca], sucursales/[slug]). Antes exponían `precio_costo_ars/usd`, `observaciones_internas`, `vendedor_asignado_id` al cliente. Ahora usan columnas explícitas centralizadas en `lib/vehiculos.ts` (`CAMPOS_VEHICULO_PUBLICO` / `CAMPOS_VEHICULO_DETALLE`).
- Home (`app/(public)/page.tsx`) migrado de client component con fetch inseguro en el browser a server component con `revalidate=60`.
- `webhooks/wa/[token]/route.ts`: si falta `META_APP_SECRET` ahora devuelve 401 en vez de saltear la validación de firma silenciosamente (ya estaba resuelto al iniciar esta sesión, confirmado).
- `VehicleCatalog.tsx` (componente muerto, sin imports, duplicaba `VehiculosGrid` con `select("*")` sin paginación) — borrado.

### SEO
- `generateMetadata` dinámico + JSON-LD `Vehicle`/`Offer` en `catalogo/[slug]/page.tsx`.
- `metadataBase` agregado en `app/layout.tsx`.
- `sitemap.ts` reescrito: incluye fichas de auto dinámicas, marcas, sucursales, landings Karry/Rely y páginas estáticas que faltaban (antes solo tenía home + catálogo + 3 sucursales hardcodeadas). Se sumó `/mundo-chino`.
- Keywords agregadas: `rely`, `karry`, `concesionario oficial rely`, `concesionario oficial karry`.
- OG/Twitter cards, JSON-LD `AutoDealer`, `prefers-reduced-motion` — confirmados ya resueltos por Gemini CLI antes de retomar esta sesión.

### Performance
- `next/image` convertido en todas las imágenes de contenido público de tráfico alto: `VehiculosGrid`, `GaleriaVehiculo` (con `priority` en la primera foto), relacionados en ficha de auto, hero de sucursal, Sucursales (home), Marcas (home + página), Footer badges, BannerPublicitario, ComparadorModal, avatar comparador flotante, nosotros (equipo), favoritos, LandingKarry, LandingRely, IntroLoader quedó afuera a propósito (overlay decorativo 2s, sin impacto).
- `remotePatterns` configurado en `next.config.ts` para `*.b-cdn.net`, `upload.wikimedia.org`, `images.unsplash.com`.
- `dangerouslyAllowSVG: true` + CSP de imagen agregado — bug real que rompía todos los logos SVG de marcas (Wikimedia) al convertir a `next/image`, ya resuelto.

### Nuevas features del panel
- **Tasación con historial**: `cotizaciones/page.tsx` + `HistorialTasacionBadge.tsx` — agrupa por teléfono, badge expandible con tasaciones previas del mismo cliente, sin query extra.
- **Tesorería** (`/panel/tesoreria`): tabla `cuentas` (banco/tarjeta/efectivo), saldo = inicial + movimientos_caja vinculados, modal alta cuenta, selector de cuenta agregado al modal de gasto existente.
- **Postventa** (`/panel/postventa`): tabla `postventa_casos` (service/reclamo/garantía), estado Pendiente→En proceso→Resuelto con selector inline, modal alta caso, vínculo opcional a vehículo.
- SQL de estas 3 features está en `SQL_PENDIENTE.sql` en la raíz — **confirmar si ya se corrió en Supabase**.
- Sidebar del panel actualizado con los nuevos links (Postventa en Operaciones, Tesorería en Administración, solo admin).

### Refactors / limpieza
- `lib/ventas.ts` (`getVentasPanel`) y `SucursalFilterHeader.tsx` compartidos — antes duplicados en `/panel/gastos` y `/panel/metricas`.
- `lib/turnstile.ts` — helper de verificación extraído (antes duplicado en cada API route).
- `lib/vehiculos.ts` — columnas públicas centralizadas (ver Seguridad).

### Home / público — features de contenido
- "Mundo Chino": nueva sección `/mundo-chino`, mismo patrón que `/0km` y `/outlet`, filtra por marcas chinas (`MARCAS_CHINAS` exportado desde `VehiculosGrid.tsx`).
- Banners del home (`BannerPublicitario.tsx`) reapuntados: banner 1 → Casa Central, banner 2 → Don Torcuato, banner 3 → Mundo Chino. Fotos de stock Unsplash reemplazadas por fotos reales (`/VDM.jpeg`, `/pana.jpg`, `/Pick-up-Rely-R8-frente-1.jpg`).
- `/marcas/[marca]` ahora usa `VehiculosGrid` (mismas tarjetas que catálogo) en vez de cards glassmorphism custom.
- Catálogo (`/catalogo`): buscador centrado en desktop, chips "Probá:" centrados en mobile, precio de las cards pasado de azul a negro.
- Specs del vehículo en mobile (`catalogo/[slug]`): grid 2x2 en vez de columna apilada.

### Dark mode del panel (parcial — ver WIP)
- Infraestructura: toggle luna/sol (sidebar desktop + header mobile), persiste en `localStorage` (`panelDarkMode`), clase `.dark` scoped solo al panel vía `@custom-variant dark (&:where(.dark, .dark *));` en `app/globals.css` — no afecta el sitio público.
- Paleta navy: `#001233` (fondo general), `#001c55` (cards/header/sidebar), `#00246b` (inputs/hover), `#0a2a6b` (bordes), `#002a6e` (hover secundario).
- Páginas 100% convertidas a dark: `/panel` (Stock), `/panel/ventas`, `/panel/gastos` + `NuevoGastoModal`, `/panel/usuarios`, `/panel/cotizaciones` + `HistorialTasacionBadge` + `PrecioSugeridoEditor`, `/panel/tesoreria` + `NuevaCuentaModal`, `SucursalFilterHeader` (compartido).
- Bug del toggle "no funciona" investigado y resuelto — era cache vieja del tab del browser, no bug de código (confirmado con el usuario, "ya funciona").

---

## 2. Procesos a la Mitad (WIP)

### Dark mode del panel — el más grande, quedó a mitad de camino
Convertidas 7 páginas + 4 modales/componentes compartidos. **Faltan sin tocar:**
- `/panel/postventa` + `NuevoCasoPostventaModal.tsx` + `EstadoCasoSelector.tsx` (páginas nuevas de esta misma sesión, nacieron ya en modo claro)
- `/panel/metricas`
- `/panel/crm` + `KanbanBoard.tsx`
- `/panel/chat` + `ChatClient.tsx`
- `/panel/tareas` + `TareasKanban.tsx`
- `/panel/taller` + `TallerClient.tsx`
- `/panel/informes` + `ReporteIA.tsx`
- `/panel/contactos` + `ContactosClient.tsx`
- `/panel/citas` + `EstadoVisitaSelector.tsx`, `VendedorVisitaSelector.tsx`, `CambiarEstadoVisita.tsx`
- `/panel/consignaciones`
- `/panel/pedidos` + `PedidosClient.tsx`
- `/panel/sueldos/liquidador` + `LiquidadorClient.tsx`
- `/panel/sueldos/categorias`
- `/panel/marketing/*` (embudo, pautados, busquedas, chatbot)
- `/panel/boletos`, `/panel/senas`, `/panel/presupuestos`, `/panel/resp-civil` (módulos nuevos del 2026-08-14, nacieron en modo claro)
- `/panel/ventas/financiaciones` + `FinanciacionesClient.tsx`
- `/panel/ventas/imprimir/[id]` + `ImprimirBoleto.tsx`
- `/panel/ventas/seguimiento/[id]` + `SeguimientoClient.tsx`
- `/panel/vehiculo/*` (nuevo, editar, boleto, `VehiculoForm.tsx`)
- `/panel/clientes/nuevo`
- Componentes sueltos en raíz de `/panel`: `AccionesAuto.tsx`, `PrecioEditor.tsx`, `SucursalEditor.tsx`, `VendedorEditor.tsx`, `EdicionSucursal.tsx`, `EdicionPrecio.tsx`

**Patrón a replicar** (ya usado 7 veces, es mecánico): `bg-white`→`dark:bg-[#001c55]`, `bg-[#F9FAFB]`→`dark:bg-[#001233]`, `border-slate-200/100`→`dark:border-[#0a2a6b]`, `text-slate-900`→`dark:text-white`, `text-slate-500/600/700`→`dark:text-slate-400/300/200`, `bg-slate-50`→`dark:bg-[#00246b]`, `hover:bg-slate-50/100`→`dark:hover:bg-[#002a6e]`.

### Auditoría "todo lo de public" — 3 informes entregados, 1 de 3 críticos resuelto
Se lanzaron 3 auditorías en paralelo (funcionalidad, UI/responsive, datos/queries) sobre todo `app/(public)/`. Resultado, con lo ya resuelto tachado:

- ~~🔴 `select("*")` exponiendo campos internos~~ → **RESUELTO** (ver sección 1)
- ~~🔴 `VenderForm` sin Turnstile / lógica de negocio en cliente~~ → **RESUELTO** (ver sección 1)
- 🟡 `VenderForm` (ya reescrito, heredado del rewrite): verificar que no queden referencias muertas a `verificaciones_sms` en otro lado del código, o si esa tabla sigue usándose en algo — **no verificado**.
- ~~🟡 `PublicHeader.tsx`: texto `text-[7px]` con contraste bajo en "Concesionario oficial"~~ → **RESUELTO** (2026-08-14): `text-slate-500`→`text-slate-600`.
- 🟡 `PublicHeader.tsx`: `AnimatePresence` nav↔buscador puede causar layout shift — **sin tocar**.
- ~~🟡 Links de logos Rely/Karry y banners CTA sin `focus-visible`~~ → **RESUELTO** (2026-08-14): `focus-visible:ring` agregado en `PublicHeader.tsx` (logos Rely/Karry) y `BannerPublicitario.tsx` (los 3 banners CTA).
- ~~🟡 `catalogo/[slug]/page.tsx`: queries en cascada~~ → **RESUELTO** (2026-08-14): las 3 queries secundarias (marca/precio similar/destacados) ya estaban en `Promise.all`; se agregó `cache()` de React a `buscarAuto()` para no duplicar la consulta principal entre `generateMetadata` y el render de la página (antes corría 2 veces por request).
- ~~🟡 `VehiculosGrid.tsx:214`: `alt=""` en thumbnail no decorativo~~ → **RESUELTO** (2026-08-14): ahora usa `${auto.marca} ${auto.modelo}`.
- 🟡 Home sin manejo de error de red visible si la query falla (era client-side, ahora es server component — revisar si sigue aplicando el hallazgo post-migración) — **no re-verificado tras el fix de home**.
- 🟢 Radios/sombras de cards inconsistentes entre secciones (24px/28px/32px sin sistema) — **sin tocar, cosmético**.
- 🟢 TODOs conocidos: hero real Rely (`LandingRely.tsx:135`), fotos reales `VentasRealizadas.tsx:5` — **bloqueados por vos** (fotos), no son bug de código.
- 🟢 `alt="Marca Registrada"` redundante en ícono ® — **sin tocar, cosmético**.

---

## 3. Pendientes (Backlog)

### De la auditoría de seguridad/SEO/perf/animaciones original
- **CSP** (Content Security Policy) en `next.config.ts` — no se agregó porque necesita allowlist cuidadoso de Turnstile, Anthropic, Bunny, Google Maps, Tabler Icons, y probarlo antes de producción para no romper nada. Los otros 4 headers de seguridad ya están.
- `next/image` en el resto de imágenes de menor tráfico que quedaron afuera a propósito la primera vuelta (revisar si sigue quedando algo suelto fuera de lo ya convertido).

### Del backlog general del proyecto (histórico, previo a esta sesión)
- Dashboard inicio: decidido que se queda en `/panel/metricas`, no se mueve a `/panel` raíz.
- Tasación con historial → **HECHO esta sesión**.
- Tesorería (bancos/tarjetas) → **HECHO esta sesión** (motor cuentas + saldo).
- Postventa → **HECHO esta sesión** (casos service/reclamo/garantía).
- Stock en tiempo real (Supabase Realtime) — charlado, no implementado, no pedido explícitamente.
- Liquidador de sueldos: motor armado en sesiones previas, **sigue sin categorías de empleado reales cargadas**, no probado con datos de verdad.
- Integración MercadoLibre / Meta Ads / Google Ads, publicación automática en redes, firma digital de boletos, OCR DNI, GPS entregas, app móvil vendedores, módulo postventa completo con turnos de service reales (lo hecho ahora es solo el registro de casos), dashboard con objetivo/ganancia/ranking (ya vive en metricas), correo Gmail integrado, alertas automáticas, clientes dormidos, autorizaciones de descuentos/permutas, recordatorios WhatsApp automáticos — todo esto **sin arrancar**, viene de listas previas a esta sesión.

### Env vars bloqueadas por vos (sin cambios esta sesión)
- `ANTHROPIC_API_KEY` sin crédito → todo lo de IA apagado
- `OPENAI_API_KEY` vacía → precio sugerido del cotizador apagado
- `GOOGLE_PLACE_ID` / `GOOGLE_MAPS_API_KEY` vacías → reviews en fallback estático
- `META_WHATSAPP_TOKEN` / `META_WHATSAPP_PHONE_NUMBER_ID` vacías → WhatsApp no envía de verdad

---

## 4. Bloqueos / Dudas

1. ~~¿Corriste `SQL_PENDIENTE.sql`?~~ **RESUELTO** — confirmado con schema dump + query a `pg_policies`: tabla `cuentas`, columna `movimientos_caja.cuenta_id`, tabla `postventa_casos` y ambas policies ("Staff gestiona cuentas", "Staff gestiona postventa") están aplicadas. Tesorería y Postventa operativas.
2. **¿Seguimos el dark mode página por página** hasta cubrir las ~25 páginas que faltan (lista completa en sección 2), **o lo dejamos así** (7 páginas más usadas ya cubiertas) y priorizamos otra cosa?
3. **¿Atacamos los hallazgos 🟡 de la auditoría de `public`** (contraste bajo en header, focus-visible faltante, queries en cascada sin paralelizar, alt text) **o quedan para después**?
4. **CSP**: ¿querés que arme el allowlist igual (con testing manual antes de confiar en él), o preferís dejarlo afuera por ahora dado el riesgo de romper Turnstile/Maps/etc?
5. No hay credenciales de test para el panel disponibles para mí — cualquier verificación visual del panel la tenés que hacer vos y avisarme si algo se ve mal (como pasó con el toggle de dark mode).

---

## 5. Próximo Paso Sugerido

**Correr `SQL_PENDIENTE.sql`** si todavía no lo hiciste — es lo único que puede estar rompiendo silenciosamente Tesorería y Postventa ahora mismo, y es un paso tuyo, no mío.

Después de eso, mi sugerencia de orden:
1. Terminar el dark mode del panel (es mecánico, ya hay patrón probado, solo falta volumen) — arrancaría por `/panel/postventa` y `/panel/metricas` por ser las más nuevas/usadas de las que faltan.
2. Limpiar los 🟡 rápidos de la auditoría de `public` (contraste texto header, focus-visible, alt text) — son cambios chicos y acotados.
3. Dejar CSP y la paralelización de queries en `catalogo/[slug]` para el final, son los de mayor riesgo/menor urgencia.

Decime con cuál seguimos.
