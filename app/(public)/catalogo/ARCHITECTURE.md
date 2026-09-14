# Catálogo público — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Arquitectura de la página

- **`page.tsx`** (server component) — trae la **primera tanda sin filtros** (12 vehículos) en el servidor, para que el HTML inicial no dependa de JS (crawlers/IA). Usa un cliente Supabase propio (no el `supabase2` del cliente) con `NEXT_PUBLIC_SUPABASE2_URL`/`NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY` — **estas env vars tienen que estar habilitadas también para el entorno Preview en Vercel**, si no el build entero falla con `supabaseKey is required` al recolectar datos de rutas que las usan a nivel de módulo (no solo esta página — pasa lo mismo en `app/api/buscar-ia/route.ts`).
- **`CatalogoClient.tsx`** (client component) — maneja filtros, búsqueda y paginación 100% en el cliente con su propio fetch a `vehiculos`, independiente del server component.

## Fuente de datos y filtro base

- Tabla: `public.vehiculos`. **Filtra siempre `estado in (disponible, reservado)`** — este es el único criterio de "visible en la web". No mira `publicado_ml` (ese campo es de MercadoLibre, ver `app/panel/stock/ARCHITECTURE.md`).
- Columnas: `lib/vehiculos.ts` → `CAMPOS_VEHICULO_PUBLICO`. Nunca ampliar a `select("*")` en este archivo — expondría columnas internas de costo/margen al público.

## Filtros

- **Marcas**: se cargan dinámicamente desde el stock real (`marcasDB`, fetch a `vehiculos.marca` filtrado por `estado`), deduplicadas con `normalizarMarca()` de `lib/vehiculos.ts` (para no listar "Citroën" y "Citroen" como dos opciones). Hay una `LISTA_MARCAS_FALLBACK` hardcodeada solo para el instante antes de que resuelva el fetch — no es la fuente de verdad, no agregar marcas nuevas ahí pensando que van a aparecer en el filtro real.
- **Sucursales**: `sucursalesDB`, fetch dinámico a la tabla `sucursales`.
- **Precio/tipo/condición**: filtros directos sobre columnas de `vehiculos`.
- **Búsqueda de texto**: `ilike` sobre marca/modelo/tipo/segmento; si no encuentra nada, cae a un buscador con IA (`BuscadorFallback.tsx`, endpoint `app/api/buscar-ia/route.ts`).

## Conexión con Stock (panel interno)

- No comparten componentes de UI, pero sí la tabla `vehiculos` y la utilidad `normalizarMarca()`. Un cambio de esquema en `vehiculos` (nueva columna, cambio de valores de `estado` o `condicion`) afecta a los dos lados — revisar ambos `ARCHITECTURE.md`.
- El home (`app/(public)/page.tsx`) también consulta `vehiculos` para armar `marcasEnStock` (componente `Marcas.tsx`) — mismo patrón de `normalizarMarca()`, considerar unificar si se toca de nuevo.

## No tocar sin revisar el resto

- No introducir un segundo criterio de "publicado" distinto a `estado in (disponible, reservado)` — ya hubo un hallazgo de auditoría por la confusión entre esto y `publicado_ml`.
- Los tres archivos que dependen de `NEXT_PUBLIC_SUPABASE2_*` (este `page.tsx`, `app/api/buscar-ia/route.ts`, y cualquier otro que instancie `createClient` a nivel de módulo) fallan el build completo si esas env vars no están en Preview — si el deploy de Vercel falla con `supabaseKey is required`, empezar por ahí.
