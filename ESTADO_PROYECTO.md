# Estado del Proyecto — Pfaffen Autos

Reporte de sesión larga de trabajo. Última actualización: 2026-08-17.

---

## 0. Reestructura de Operaciones (2026-08-14)

Se retiró el flujo unificado "Nueva Operación" (`ventas/nueva/VentaForm.tsx`, ya borrado) y se separó en 4 módulos independientes, cada uno con su propia carga/listado/impresión:

- **Presupuestos** (`/panel/presupuestos`), **Señas** (`/panel/senas`), **Ventas** (`/panel/boletos`, tabla `boletos_venta`), **Resp. Civil** (`/panel/resp-civil`) — 4 módulos completos, activando tablas legacy que existían en Supabase pero nunca se usaban.
- Componentes compartidos nuevos: `ClienteBuscador.tsx`, `VehiculoSelector.tsx` (buscar/crear cliente, elegir vehículo del stock o cargar manual).
- **Migración completa de todo lo que leía la vieja tabla `ventas`** a `boletos_venta`: Tesorería (`/panel/gastos`), Métricas, Liquidador de Sueldos, Postventa, Embudo de Marketing, Informes, Financiaciones, seguimiento por etapas + checklist de documentación (`documentacion_ventas`), tracker público (`/seguimiento/[codigo]`), agradecimiento automático por WhatsApp, venta rápida desde ficha de auto (`AccionesAuto.tsx`).
- Comisión del vendedor (`comision_ars`/`porcentaje_comision`) agregada a `boletos_venta`, calculada por % sobre venta_ars en el form.
- Probado end-to-end en browser con 2 boletos de prueba reales — 3 bugs encontrados y arreglados en la prueba: `fecha_nacimiento: ""` rompía alta de cliente (columna `date`), FK vieja en `documentacion_ventas`/`financiaciones` apuntando a `ventas` (rompía con 409 al guardar), `vehiculos.dominio` no existe — es `patente` (rompía Tesorería/Métricas, mostraban todo en $0 sin error visible).
- Tabla `ventas` y sus páginas de impresión histórica (`/panel/ventas/imprimir/[id]`) quedan intactas para no perder datos viejos, pero ya no reciben cargas nuevas.

---

## 1. Tareas Completadas

### Dark mode del panel — 100% COMPLETO (2026-08-17)
- Infraestructura: toggle luna/sol (sidebar desktop + header mobile), persiste en `localStorage` (`panelDarkMode`), clase `.dark` scoped solo al panel vía `@custom-variant dark (&:where(.dark, .dark *));` en `app/globals.css` — no afecta el sitio público.
- Paleta navy: `#001233` (fondo general), `#001c55` (cards/header/sidebar), `#00246b` (inputs/hover), `#0a2a6b` (bordes), `#002a6e` (hover secundario).
- **Todo `/panel` convertido** (~75 archivos): las 7 páginas que ya estaban de la vuelta anterior + todo lo que faltaba (postventa, métricas, CRM completo, chat, tareas, taller, informes, contactos, citas, consignaciones, pedidos, sueldos, marketing completo, boletos/señas/presupuestos/resp-civil, financiaciones, vehículo nuevo/editar/boleto, clientes/nuevo, y todos los componentes sueltos: AccionesAuto, PrecioEditor, SucursalEditor, VendedorEditor, EdicionSucursal, EdicionPrecio).
- Páginas de impresión (`Imprimir*.tsx`): solo el panel de control `print:hidden` recibió `dark:`, la hoja A4 de vista previa queda permanentemente clara (representa papel físico impreso, no depende del tema).
- Verificado con auditoría exhaustiva (grep de `dark:` cero-residuos) + `tsc --noEmit` limpio en todo el árbol.

### Showroom 3D (nuevo, en progreso) — `/showroom-test/[marca]`
- Feature experimental con Three.js/`@react-three/fiber`/`@react-three/drei`: vista cenital de una fila de autos (placeholders geométricos por ahora), tocás uno → tarjeta de confirmación flotante con badge de disponibilidad → cámara se acerca a vista exterior del auto elegido → botón "Volver a la fila".
- Entrada con scroll: `ShowroomEntrada.tsx` (Framer Motion `useScroll`/`useTransform`) — foto de fachada real de la sucursal en pantalla completa, zoom+fade al hacer scroll, revela el showroom 3D debajo.
- Modelos reales `.glb` — **pendiente, se consiguen después** (ver WIP).
- Solo Karry activo por ahora (Cabina Simple + Cabina Doble, 1 unidad cada uno). Rely queda para después.
- Fix aplicado: se sacó `<Environment preset="city">` de `@react-three/drei` (dependía de un fetch externo a `raw.githubusercontent.com` que tiraba 503 en producción) — reemplazado por luces manuales (`ambientLight` + 2 `directionalLight`).

### Auditoría "todo lo de public" — cerrada (2026-08-17)
- `PublicHeader.tsx`: `AnimatePresence` del swap nav↔buscador (desktop, `isScrolled`) pasado de `mode="wait"` a `mode="popLayout"` — evita el hueco vacío entre que el nav sale y el buscador entra (con `mode="wait"` el saliente tenía que desaparecer del todo antes de que el nuevo empezara a aparecer). El layout en sí nunca corría riesgo real de reflow: la fila del header usa CSS grid `grid-cols-[auto_1fr_auto]` con alto fijo `h-20`, así que las columnas izquierda/derecha no se movían — el problema era el parpadeo visual, ya resuelto.
- Home (`app/(public)/page.tsx`) re-verificado post-migración a server component: si la query a `vehiculos` falla, `data` llega `null` y el código ya hace `vehiculos || []` — la sección de Stock se muestra vacía en vez de romper la página. Degradación aceptable para una landing pública, no hace falta agregar UI de error visible al visitante. Hallazgo cerrado, sin cambios de código necesarios.
- Con esto, los 3 informes de la auditoría de `public` quedan sin hallazgos 🔴/🟡 pendientes (quedan solo los 🟢 cosméticos de la sección de Backlog).

### Seguridad
- Uploads (`/api/upload`, `/api/upload-bunny`) ahora requieren sesión de staff logueada + límite 15MB + solo `image/*`.
- Rate limiting agregado (`lib/rateLimit.ts`, in-memory por IP) en: cotizaciones, visitas, chat, buscar-ia, upload-cotizacion.
- Headers de seguridad en `next.config.ts`: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. (CSP quedó pendiente, ver Backlog).
- Turnstile agregado a `AgendarVisitaForm.tsx` (antes insertaba directo a Supabase sin protección).
- `VenderForm.tsx` reescrito para funcionar exactamente igual que `ConsignarForm.tsx`: 3 pasos, Turnstile, pasa por `/api/cotizaciones` (rate-limited, server-side) en vez de insertar directo a Supabase con webhooks n8n hardcodeados sin protección.
- **CRÍTICO resuelto**: se sacó `select("*")` de las 7 páginas públicas que consultan `vehiculos` (home, catálogo listado, catálogo detalle, 0km, outlet, mundo-chino, marcas/[marca], sucursales/[slug]). Antes exponían `precio_costo_ars/usd`, `observaciones_internas`, `vendedor_asignado_id` al cliente. Ahora usan columnas explícitas centralizadas en `lib/vehiculos.ts` (`CAMPOS_VEHICULO_PUBLICO` / `CAMPOS_VEHICULO_DETALLE`).
- Home (`app/(public)/page.tsx`) migrado de client component con fetch inseguro en el browser a server component con `revalidate=60`.
- `webhooks/wa/[token]/route.ts`: si falta `META_APP_SECRET` ahora devuelve 401 en vez de saltear la validación de firma silenciosamente.
- `VehicleCatalog.tsx` (componente muerto, sin imports, duplicaba `VehiculosGrid` con `select("*")` sin paginación) — borrado.

### SEO
- `generateMetadata` dinámico + JSON-LD `Vehicle`/`Offer` en `catalogo/[slug]/page.tsx`.
- `metadataBase` agregado en `app/layout.tsx`.
- `sitemap.ts` reescrito: incluye fichas de auto dinámicas, marcas, sucursales, landings Karry/Rely y páginas estáticas que faltaban. Se sumó `/mundo-chino`.
- Keywords agregadas: `rely`, `karry`, `concesionario oficial rely`, `concesionario oficial karry`.
- OG/Twitter cards, JSON-LD `AutoDealer`, `prefers-reduced-motion` — confirmados resueltos.

### Performance
- `next/image` convertido en todas las imágenes de contenido público de tráfico alto: `VehiculosGrid`, `GaleriaVehiculo` (con `priority` en la primera foto), relacionados en ficha de auto, hero de sucursal, Sucursales (home), Marcas (home + página), Footer badges, BannerPublicitario, ComparadorModal, avatar comparador flotante, nosotros (equipo), favoritos, LandingKarry, LandingRely. IntroLoader quedó afuera a propósito (overlay decorativo 2s, sin impacto).
- `remotePatterns` configurado en `next.config.ts` para `*.b-cdn.net`, `upload.wikimedia.org`, `images.unsplash.com`.
- `dangerouslyAllowSVG: true` + CSP de imagen agregado — bug real que rompía todos los logos SVG de marcas (Wikimedia) al convertir a `next/image`, ya resuelto.

### Fotos de autos — remove.bg + Bunny CDN
- Parámetros de `lib/removeBg.ts` ajustados tras varias rondas de prueba con fotos reales de fábrica: `scale: "65%"`, `crop_margin: "20%"`, `shadow_type: "car"`, `type: "car"`, `position: "center"`, `size: "auto"` — el auto queda centrado, con margen y sombra de piso, sin cortarse en los bordes (antes `scale: 90%` + `crop_margin: 5%` pegaba el auto contra el marco).
- Fondo de estudio nuevo generado (prompt de dealership profesional) y subido a Bunny CDN (`fondos/fondo.png`).
- Techo de calidad: la resolución final depende del plan pago de remove.bg (`size: "auto"` ya pide lo mejor disponible), no de los parámetros de encuadre.

### Nuevas features del panel
- **Tasación con historial**: `cotizaciones/page.tsx` + `HistorialTasacionBadge.tsx` — agrupa por teléfono, badge expandible con tasaciones previas del mismo cliente, sin query extra.
- **Tesorería** (`/panel/tesoreria`): tabla `cuentas` (banco/tarjeta/efectivo), saldo = inicial + movimientos_caja vinculados, modal alta cuenta, selector de cuenta agregado al modal de gasto existente.
- **Postventa** (`/panel/postventa`): tabla `postventa_casos` (service/reclamo/garantía), estado Pendiente→En proceso→Resuelto con selector inline, modal alta caso, vínculo opcional a vehículo.
- Sidebar del panel actualizado con los nuevos links (Postventa en Operaciones, Tesorería en Administración, solo admin).

### Refactors / limpieza
- `lib/ventas.ts` (`getVentasPanel`) y `SucursalFilterHeader.tsx` compartidos — antes duplicados en `/panel/gastos` y `/panel/metricas`.
- `lib/turnstile.ts` — helper de verificación extraído (antes duplicado en cada API route).
- `lib/vehiculos.ts` — columnas públicas centralizadas (ver Seguridad).

### Home / público — features de contenido
- "Mundo Chino": nueva sección `/mundo-chino`, mismo patrón que `/0km` y `/outlet`, filtra por marcas chinas (`MARCAS_CHINAS` exportado desde `VehiculosGrid.tsx`).
- Banners del home (`BannerPublicitario.tsx`) reapuntados: banner 1 → Casa Central, banner 2 → Don Torcuato, banner 3 → Mundo Chino. Fotos de stock Unsplash reemplazadas por fotos reales.
- `/marcas/[marca]` ahora usa `VehiculosGrid` (mismas tarjetas que catálogo) en vez de cards glassmorphism custom.
- Catálogo (`/catalogo`): buscador centrado en desktop, chips "Probá:" centrados en mobile, precio de las cards pasado de azul a negro.
- Specs del vehículo en mobile (`catalogo/[slug]`): grid 2x2 en vez de columna apilada.

---

## 2. Procesos a la Mitad (WIP)

### WhatsApp propio (reemplazo de Redoo + Pilot) — BLOQUEADO
- El webhook de Meta WhatsApp Cloud API (`app/api/webhooks/wa/[token]/route.ts`) ya está listo en el código desde antes — handshake, verificación de firma, ingesta de mensajes a `/panel/chat`, IA de agente. No hace falta ningún producto de terceros (Forja/AgentKit/etc.), solo credenciales reales de Meta.
- Se conectó un número de prueba gratuito de Meta y se completó `META_WHATSAPP_PHONE_NUMBER_ID` en `.env.local`. Faltaban `META_WHATSAPP_TOKEN` y `META_APP_SECRET`.
- **La cuenta de desarrollador de Meta quedó suspendida** (Platform Policy 7.e.i.3, probable falso positivo). Se presentó la apelación, Meta respondió con error genérico de "intentar más tarde". Decisión explícita: **no tocar la cuenta del jefe con workarounds hasta estar seguros de que funciona** — queda esperando respuesta de Meta a la apelación.

### Integración MercadoLibre — arrancada, BLOQUEADA
- Investigado en profundidad: categoría `MLA1744` (Autos y Camionetas), 8 atributos requeridos (marca, modelo, año, versión, tipo, combustible, puertas, km), Karry y Rely ya existen como marcas reconocidas en la taxonomía de ML. Google Vehicle Ads queda descartado — no existe en Argentina.
- Preparado en paralelo mientras se consiguen las credenciales: `ENCRYPTION_KEY` generada en `.env.local` (reutiliza `lib/crypto/index.ts`, AES-256-GCM, ya usado para otros secretos), placeholders `ML_CLIENT_ID`/`ML_CLIENT_SECRET`/`ML_REDIRECT_URI` agregados, y sección nueva en `SQL_PENDIENTE.sql` (tabla `mercadolibre_config` para tokens OAuth encriptados + columnas `ml_item_id`/`ml_estado`/`ml_publicado_at`/`ml_error` en `vehiculos`).
- **Bloqueado**: no se puede entrar a la cuenta de MercadoLibre para registrar la app y sacar `client_id`/`client_secret` en `applications.mercadolibre.com`.
- Importante para cuando se retome: la publicación automática por API no reduce el costo del paquete de Autos en ML Argentina (subió a ~$326.000 ARS/mes en nov-2025) — ese costo es del marketplace, no de la integración.

### Showroom 3D — pendientes
- Modelos `.glb` reales en vez de las cajas geométricas placeholder — se consiguen más adelante.
- Rely: mismo tratamiento que Karry, queda para después.
- Decisión sin tomar: si `/showroom-test/[marca]` debería salir del layout compartido `(public)` (Header/Footer) para una experiencia full-bleed sin esos elementos encima.

### Fondo de estudio en Bunny CDN — posible cache
- Al subir una versión nueva de `fondos/fondo.png` (mismo nombre de archivo), las fotos procesadas seguían mostrando el fondo viejo. Diagnóstico: probablemente cache de borde de Bunny CDN sirviendo el archivo anterior. Se sugirió purgar cache desde el dashboard de Bunny o subir con nombre de archivo nuevo — **no confirmado si se resolvió**, el usuario cambió de tema antes de verificar.

### Plantilla de carga masiva de autos (Excel/CSV) — sin especificar
- Pedida, pero las 3 preguntas de alcance (qué campos, formato exacto, validación) quedaron sin responder — no arrancada.

---

## 3. Pendientes (Backlog)

### De la auditoría de seguridad/SEO/perf/animaciones original
- **CSP** (Content Security Policy) en `next.config.ts` — no se agregó porque necesita allowlist cuidadoso de Turnstile, Anthropic, Bunny, Google Maps, Tabler Icons, y probarlo antes de producción para no romper nada. Los otros 4 headers de seguridad ya están.
- `next/image` en el resto de imágenes de menor tráfico que quedaron afuera a propósito la primera vuelta.

### Cosmético / bajo impacto (de la auditoría de public, sin tocar)
- Radios/sombras de cards inconsistentes entre secciones (24px/28px/32px sin sistema).
- TODOs conocidos: hero real Rely (`LandingRely.tsx:135`), fotos reales `VentasRealizadas.tsx:5` — bloqueados por fotos, no son bug de código.
- `alt="Marca Registrada"` redundante en ícono ®.
- `VenderForm` (heredado del rewrite): verificar que no queden referencias muertas a `verificaciones_sms` en otro lado del código — no verificado.

### Del backlog general del proyecto
- Dashboard inicio: decidido que se queda en `/panel/metricas`, no se mueve a `/panel` raíz.
- Stock en tiempo real (Supabase Realtime) — charlado, no implementado, no pedido explícitamente.
- Liquidador de sueldos: motor armado, **sigue sin categorías de empleado reales cargadas**, no probado con datos de verdad.
- Meta Ads / publicación automática en redes, firma digital de boletos, OCR DNI, GPS entregas, app móvil vendedores, módulo postventa completo con turnos de service reales (lo hecho ahora es solo el registro de casos), correo Gmail integrado, alertas automáticas, clientes dormidos, autorizaciones de descuentos/permutas, recordatorios WhatsApp automáticos — todo esto sigue sin arrancar.

### Env vars bloqueadas por vos
- `ANTHROPIC_API_KEY` sin crédito → todo lo de IA apagado
- `OPENAI_API_KEY` vacía → precio sugerido del cotizador apagado
- `GOOGLE_PLACE_ID` / `GOOGLE_MAPS_API_KEY` vacías → reviews en fallback estático
- `META_WHATSAPP_TOKEN` / `META_APP_SECRET` vacías → cuenta de Meta suspendida, apelación pendiente
- `ML_CLIENT_ID` / `ML_CLIENT_SECRET` / `ML_REDIRECT_URI` vacías → esperando poder entrar a la cuenta de MercadoLibre

---

## 4. Bloqueos / Dudas

1. **WhatsApp**: esperando que Meta resuelva la apelación de la cuenta suspendida. No hay nada más para hacer de mi lado hasta esa respuesta.
2. **MercadoLibre**: esperando que puedas entrar a tu cuenta de ML para registrar la app y conseguir `client_id`/`client_secret`.
3. **Fondo de estudio en Bunny**: ¿confirmás si al final se ve actualizado, o seguimos con la purga de cache / nombre de archivo nuevo?
4. **Plantilla de carga masiva**: sigue pendiente de definir alcance (qué campos, formato) cuando quieras retomarla.
5. **CSP**: ¿armamos el allowlist igual (con testing manual antes de confiar en él), o queda afuera por ahora?
6. No hay credenciales de test para el panel disponibles para mí — cualquier verificación visual del panel la tenés que hacer vos.

---

## 5. Próximo Paso Sugerido

No hay nada mío bloqueando ahora mismo — los dos frentes grandes (WhatsApp, MercadoLibre) dependen de vos (apelación de Meta / login a ML). Mientras tanto, lo más productivo:

1. Confirmar si el fondo de Bunny quedó bien o si purgamos cache.
2. Si querés seguir con el Showroom 3D: conseguir/definir los modelos `.glb` reales, o decidir si sale del layout público compartido.
3. Definir alcance de la plantilla de carga masiva cuando haya tiempo.

Decime con cuál seguimos.
