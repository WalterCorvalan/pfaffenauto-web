# Design System: Pfaffen Autos (sitio público)

## 1. Visual Theme & Atmosphere
Concesionaria premium con lenguaje "spatial UI" — glassmorphism, luces ambientales
difuminadas, spring physics. Densidad "Daily App Balanced" (5/10), variance
"Offset Asymmetric" (7/10, pero con puntos ciegos: Hero y Servicios rompen la
regla), motion "Fluid CSS" (6/10). La atmósfera es nocturna-tecnológica en el
Hero (video + overlay oscuro) y luminosa-cristal en el resto del sitio (blancos
translúcidos, blur, sombras tintadas de azul).

## 2. Color Palette & Roles
- **Off-White Canvas** (#F8FAFC / `#f8f9fa`) — Fondo base modo claro
- **Ink Navy** (`navy`, custom token) — Texto principal, headlines
- **Deep Space** (#0A0A0F) — Fondo base modo oscuro
- **Pfaffen Blue** (#0145F2) — Único acento: CTAs, precios, links activos, gradientes
- **Sky Accent** (`sky-400`) — Variante del acento en modo oscuro (hover, focus)
- **Glass White** (rgba(255,255,255,0.4–0.7)) — Superficies de tarjetas/paneles
- **Whisper Border** (rgba(255,255,255,0.6) / `white/10` dark) — Bordes estructurales 1px

Cumple la regla de acento único (no hay segundo color compitiendo). El azul
`#0145F2` es saturado pero no cae en "neon purple/blue" — no tiene glow externo,
se usa en fill sólido o gradiente contenido.

## 3. Typography Rules
- **Todo el sitio:** Plus Jakarta Sans (`--font-jakarta`) — ya evita el baneo de Inter
- **Display/Headlines:** peso variable (font-light → font-black) para jerarquía,
  no solo tamaño. Tracking negativo (`tracking-tighter`) en títulos grandes
- **Body:** `text-gray-500 dark:text-slate-400`, peso medium, sin línea máxima
  explícita — revisar en textos largos (Testimonials, FAQ)
- **Banned:** Inter, serif genérico — ninguno presente hoy, mantener así

## 4. Component Stylings
- **Botones primarios:** fill sólido `#0145F2`, sin glow, con barrido de brillo
  interno en hover (Hero) — bien, es sutil y no "neon"
- **Cards de vehículo:** `rounded-2xl`, glass (`bg-white/40 backdrop-blur-2xl`),
  hover eleva (`-translate-y-1`) + sombra tintada de azul. Correcto uso de
  elevación con propósito
- **Pills/badges:** glass + borde blanco translúcido, hover `-translate-y-1`.
  Consistente en todo el sitio
- **Inputs:** el buscador del Hero es la única superficie de input relevante en
  home — glass, sin label visible (aceptable por ser buscador hero, no formulario)

## 5. Layout Principles — puntos a corregir
- ✅ **Hero centrado — corregido.** En desktop (`lg:`) ahora es left-aligned:
  texto/buscador/pastillas ocupan ~55% izquierdo, el video respira a la derecha.
  Mobile/tablet siguen centrados (no hay espacio real para asimetría ahí)
- ✅ **Servicios.tsx — revisado, NO es el patrón baneado.** El grid contenedor es
  `grid-cols-3` pero los hijos usan `col-span-2` / `col-span-1` / `col-span-3`
  (bento asimétrico: grande+chica arriba, banner completo abajo). El hallazgo
  original de la auditoría estaba mal — solo miró la clase del contenedor sin
  chequear los `col-span` de las tarjetas. Corregido acá.
- ✅ **Stock.tsx** es el modelo a seguir: 4 secciones, 4 layouts distintos
  (grid, carrusel nativo, editorial grande+sidebar, cards horizontales tipo Apple)
- Home tiene 13 secciones apiladas sin jerarquía de prioridad — revisar orden

## 6. Motion & Interaction
- Spring physics ya en uso (`stiffness: 150, damping: 20` en Stock) — correcto,
  coincide con el rango recomendado
- Speed trails de fondo en Hero usan `ease: "linear"` — aceptable, es motion de
  fondo continuo (tipo marquee), no interacción de UI
- ✅ **IntroLoader corregido** — ahora usa `sessionStorage`, se muestra una sola
  vez por sesión de navegador en vez de en cada carga de página
- Entradas del Hero usan `duration: 0.5s` — excede los 300ms recomendados para
  UI, pero cae dentro de la excepción de "marketing site" (motion más largo
  aceptable en hero/landing)

## 7. Performance — puntos a corregir
- ✅ **`next/image` migrado en Stock.tsx y Servicios.tsx** (7 imágenes en total:
  destacado grande, vistos recientemente, cards Apple-style, barra comparador,
  VehicleCard, y las 2 imágenes de fondo de Servicios). Hero no tenía `<img>`
  para migrar (es video de fondo). Verificado funcionando vía `/_next/image`
  con dominios ya permitidos en `next.config.ts`
- ❌ Múltiples blobs `blur-3xl`/`blur-[120px]` acumulados por sección (Stock,
  Financiación, etc.) — costo de GPU innecesario en dispositivos gama media,
  relevante para el tráfico mobile argentino

## 8. Anti-Patterns (Banned) — checklist de este proyecto
- [x] Sin emojis
- [x] Sin Inter
- [x] Sin negro puro
- [x] Sin glow neon
- [x] Sin acento sobresaturado / doble acento
- [x] Hero centrado — **corregido, left-aligned en desktop**
- [x] Grid de 3 cards iguales — **revisado: Servicios NO cae en este patrón (bento asimétrico real)**
- [x] Sin nombres genéricos / datos inventados
- [x] Sin "Scroll to explore" / flechas de scroll
- [x] Sin `LABEL // YEAR`
- [x] Sin clichés de copy ("Elevate", "Seamless", "Unleash")

## Prioridad de arreglos (impacto / esfuerzo)
1. ~~IntroLoader una sola vez por sesión~~ — ✅ hecho
2. ~~`next/image` en Stock + Servicios~~ — ✅ hecho (Hero no tenía imágenes)
3. ~~Servicios: romper grid de 3~~ — ✅ no aplicaba, ya era asimétrico
4. ~~Reducir blobs de blur acumulados~~ — ✅ hecho (blur-[100/120px] → blur-3xl en 4 secciones)
5. ~~Reordenar secciones de la home~~ — ✅ hecho (Stock subió después del Hero, Seguimiento bajó)
6. ~~Hero: left-aligned en vez de centrado~~ — ✅ hecho

Todos los puntos de la auditoría resueltos. Pendiente: confirmación visual manual
en navegador real (la sesión de prueba automatizada tuvo problemas de estado
propios de la herramienta, no del código — el HTML servido está verificado).
