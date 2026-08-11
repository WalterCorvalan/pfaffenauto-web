<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Convenciones del proyecto

## Idioma

- **Sustantivos de negocio/dominio → español.** Coincide con la base de datos (`vehiculo`, `sucursal`, `cliente`, `cotizacion`, etc.). No traducir nombres de campos ni de entidades al inglés.
- **Patrones técnicos del framework → inglés.** Hooks (`useState`, `useEffect`), manejadores de eventos (`handleSubmit`), sufijos de rol de componente (`Form`, `Modal`, `Client`, `Board`, `Editor`, `Selector`).

## Sufijos de componentes (según su rol)

| Sufijo | Uso | Ejemplos |
|---|---|---|
| `Form` | Formulario que crea/envía datos | `VehiculoForm`, `CotizadorForm`, `AgendarVisitaForm` |
| `Client` | Client component que hidrata una page server-side (mismo nombre que la carpeta de la ruta) | `ChatClient`, `ContactosClient`, `EgresosClient` |
| `Modal` | Diálogo superpuesto | `ComparadorModal`, `NuevoGastoModal` |
| `Editor` | Edición inline de un campo puntual (click para cambiar) | `PrecioEditor`, `SucursalEditor`, `VendedorEditor` |
| `Selector` | Selector inline de una opción de una lista | `EstadoVisitaSelector`, `VendedorVisitaSelector` |
| `Board` | Tablero tipo kanban | `KanbanBoard`, `TareasKanban` |

## Estructura de carpetas

- **Componentes usados por una sola página**: co-ubicados dentro de la carpeta de esa ruta (`app/.../vehiculo/VehiculoForm.tsx`), no en `components/`.
- **Componentes públicos reutilizables** (sitio web, no el panel): en `components/`, agrupados por rol:
  - `components/forms/` — formularios del sitio público
  - `components/modals/` — modales del sitio público
  - `components/landing/` — landings de marca (Karry, Rely)
  - `components/banners/` — banners de CTA
  - `components/ui/` — primitivos de UI sin lógica de negocio
  - Secciones únicas de layout/home (`Hero`, `Footer`, `PublicHeader`, `Stock`, etc.) quedan sueltas en la raíz de `components/`.
- **`lib/`**: agrupado por dominio técnico cuando hay más de un archivo relacionado (`lib/supabase/{client,server}.ts`, `lib/ai/`, `lib/crypto/`, `lib/meta/`). Un archivo suelto (`lib/upload.ts`) no amerita carpeta propia.
