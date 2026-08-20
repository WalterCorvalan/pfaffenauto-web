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
- ❌ **Hero centrado** (`items-center text-center`) con variance del sitio en 7/10.
  Debería romperse a split-screen o asimetría (auto/video a un lado, copy al otro)
- ❌ **Servicios.tsx: `grid-cols-1 lg:grid-cols-3`** — el patrón "3 cards iguales"
  explícitamente baneado. Es la única sección sin la personalidad que sí tiene Stock
- ✅ **Stock.tsx** es el modelo a seguir: 4 secciones, 4 layouts distintos
  (grid, carrusel nativo, editorial grande+sidebar, cards horizontales tipo Apple)
- Home tiene 13 secciones apiladas sin jerarquía de prioridad — revisar orden

## 6. Motion & Interaction
- Spring physics ya en uso (`stiffness: 150, damping: 20` en Stock) — correcto,
  coincide con el rango recomendado
- Speed trails de fondo en Hero usan `ease: "linear"` — aceptable, es motion de
  fondo continuo (tipo marquee), no interacción de UI
- ❌ **IntroLoader se dispara en cada carga de página, sin persistencia.**
  Un visitante recurrente ve 2 segundos de pantalla completa bloqueada
  repetidamente. Debe mostrarse una sola vez por sesión (`sessionStorage`)
- Entradas del Hero usan `duration: 0.5s` — excede los 300ms recomendados para
  UI, pero cae dentro de la excepción de "marketing site" (motion más largo
  aceptable en hero/landing)

## 7. Performance — puntos a corregir
- ❌ Ninguna imagen usa `next/image` (Hero, Stock, tarjetas) — sin lazy loading
  nativo, sin `srcset`, riesgo de layout shift. Impacta LCP, especialmente
  sumado al video de fondo autoplay del Hero
- ❌ Múltiples blobs `blur-3xl`/`blur-[120px]` acumulados por sección (Stock,
  Financiación, etc.) — costo de GPU innecesario en dispositivos gama media,
  relevante para el tráfico mobile argentino

## 8. Anti-Patterns (Banned) — checklist de este proyecto
- [x] Sin emojis
- [x] Sin Inter
- [x] Sin negro puro
- [x] Sin glow neon
- [x] Sin acento sobresaturado / doble acento
- [ ] Hero centrado — **presente, corregir**
- [ ] Grid de 3 cards iguales — **presente en Servicios, corregir**
- [x] Sin nombres genéricos / datos inventados
- [x] Sin "Scroll to explore" / flechas de scroll
- [x] Sin `LABEL // YEAR`
- [x] Sin clichés de copy ("Elevate", "Seamless", "Unleash")

## Prioridad de arreglos (impacto / esfuerzo)
1. IntroLoader una sola vez por sesión — alto impacto, 5 min
2. `next/image` en Hero + Stock — alto impacto en performance, esfuerzo medio
3. Servicios: romper grid de 3 — impacto visual medio, esfuerzo bajo
4. Hero: split-screen en vez de centrado — impacto visual alto, esfuerzo medio-alto
5. Reducir blobs de blur acumulados — impacto perf bajo-medio, esfuerzo bajo
6. Reordenar/consolidar secciones de la home — impacto UX medio, esfuerzo medio
