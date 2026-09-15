# Configuración — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## `perfiles.activo` — desactivar un usuario

`UsuariosClient.tsx` permite marcar un empleado como "Inactivo" (`perfiles.activo = false`). Esto:

- **Sí** bloquea el login (`app/panel/login/page.tsx` chequea `activo` después de `signInWithPassword` y cierra la sesión si es `false`).
- **Sí** cierra una sesión ya abierta (`app/panel/layout.tsx`, `cargarPerfil()`, corre en cada carga/cambio de sesión).
- **Sí** lo excluye de destinatarios de notificaciones (`lib/panel/notificaciones.ts`, `lib/panel/whatsappMemoria.ts`).
- **No** hay `middleware.ts` en el repo — no hay un gate central de rutas. Si agregás un flujo nuevo que dependa de `activo` (ej. un endpoint de API que un usuario desactivado podría seguir llamando con su token de Auth todavía válido), agregá el chequeo ahí también, no asumas que ya está cubierto.

## Toggles guardados en `configuracion_empresa` — verificar que algo los lea

Esta pantalla (`EmpresaClient.tsx`) guarda varios toggles/config en `configuracion_empresa`. **Ya pasó dos veces** que un toggle se guardaba pero nada lo consumía (quedaba como si estuviera "prendido" sin efecto real):

- `resumen_diario_activo` — no tenía ningún proceso que generara el resumen, hasta que se creó el cron `resumen-empresa` (ver `app/api/cron/panel-v2/resumen-empresa/route.ts`).
- `cada_vendedor_ve_solo_sus_clientes` — no lo leía nadie, hasta que se agregó el filtro en `app/panel/clientes/page.tsx` (ver `app/panel/clientes/ARCHITECTURE.md`).
- `pct_toma_consignacion` — el propio texto de ayuda de este campo dice "Sale en el listado de Cotizaciones... y en el PDF del presupuesto", pero `ModificarCotizacionModal.tsx` (donde se calcula la "toma sugerida" al aprobar una cotización con permuta) tenía el descuento hardcodeado en `0.85` (-15%) en 3 lugares, sin leer este setting para nada — corregido: ahora trae `pct_toma_consignacion` directo de `configuracion_empresa` (no vía el endpoint admin-only `/api/panel-v2/configuracion-empresa`, porque este modal también lo puede abrir un encargado no-admin) con fallback a 15 mientras carga.

Si agregás un checkbox/setting nuevo acá, antes de darlo por terminado **verificá que algún query/proceso lo lea** — guardarlo en la tabla no alcanza.

## Visibilidad de módulo completo vs. permisos finos dentro de un módulo — no son la misma cosa

Hay dos mecanismos distintos en Configuración y es fácil confundirlos:

- **`EmpresaClient.tsx` → "Módulos" + "Visibilidad por sector"** (tablas `modulos_config` y `visibilidad_sector`, vía `/api/panel-v2/modulos`): esto es lo que decide si un **módulo entero** (Clientes, Finanzas, Reportes, etc.) aparece en el menú/mobile/URL directa para cada sector (`ventas`/`encargado`/`finanzas`/`gestoria`, ver `lib/panel/modulosCatalogo.ts`). Es el mecanismo real, con UI funcionando, y es el que hay que tocar si un rol no debería ver un módulo completo (ej. `migraciones/sql_visibilidad_encargado_clientes_finanzas.sql`, que corrigió que "encargado" no veía Clientes y sí veía Finanzas/Cobros/Tesorería/Liquidaciones/Comisiones/Reportes).
- **`lib/panel/permisos.ts` → `tienePermiso(supabase, perfil, clave)`**: esto es para un permiso puntual **dentro** de un módulo que ya es visible — hoy el único caso real es `puedeVerLiquidacion` (¿puede este rol ver el margen/ganancia en Expedientes, Gestoría, Liquidaciones y Tesorería → Expedientes?), sembrado en `permisos_definiciones`/`rol_permisos` vía `migraciones/sql_permiso_ver_liquidacion.sql`. Sigue funcionando igual, se edita solo por SQL directo (no tiene pantalla propia, ver siguiente punto).

**`PermisosTab.tsx` se eliminó** — existía como pantalla ("Permisos por Rol" + "Excepciones por Usuario") pero nunca estuvo enlazada desde ningún tab de Configuración, así que era inalcanzable desde la UI y quedaba como código muerto. Las tablas que leía/escribía (`permisos_definiciones`, `rol_permisos`, `usuario_permisos`) siguen existiendo y las sigue usando `tienePermiso()` para `ver_liquidacion` — borrar el componente no tocó esos datos ni ese permiso. Si en algún momento se necesita administrar permisos finos desde la UI de nuevo, hay que reconstruir esa pantalla enlazada a un tab real, no revivir el archivo viejo tal cual (nunca se validó contra `tienePermiso()`, se armó antes de que existiera).

**Quedan ~28 chequeos de rol hardcodeados sin migrar a `tienePermiso()`** (todos los `roles.includes(...)`/`roles.some(...)` que no sean `puedeVerLiquidacion`, y que son casos de permiso fino dentro de un módulo — no confundir con visibilidad de módulo completo, que ya se resuelve con "Visibilidad por sector"). Si migrás uno nuevo: 1) elegí una clave descriptiva, 2) sembrala en `permisos_definiciones` + `rol_permisos` con el mismo default que el código hardcodeado tenía, 3) reemplazá el chequeo por `await tienePermiso(supabase, perfil, clave)` en el `page.tsx` (Server Component) y pasalo como prop al cliente, igual que `puedeVerLiquidacion` — no llamar a `tienePermiso` desde un componente `"use client"` directo, hace queries a la base.

## No tocar sin revisar el resto

- `lead_routing_activo` sí está consumido (por una función de base de datos, `migraciones/sql_fix_panel_v2_en_funciones_2.sql`) — no es del mismo tipo de bug, es el ejemplo de cómo se ve un toggle que sí funciona.
