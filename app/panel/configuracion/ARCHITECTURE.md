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

## `PermisosTab.tsx` — mecanismo central creado, migración en curso

`PermisosTab.tsx` ("Permisos por Rol" + "Excepciones por Usuario") lee/escribe 3 tablas: `permisos_definiciones`, `rol_permisos`, `usuario_permisos`. Hasta ahora **ningún otro archivo las consultaba** — la pantalla era decorativa, todo el control de acceso seguía siendo chequeos de rol hardcodeados por pantalla (`roles.includes("admin")` / `"encargado"` / `"ventas"`, ~32 ocurrencias repartidas por `app/panel/`).

**Primer paso hecho**: `lib/panel/permisos.ts` → `tienePermiso(supabase, perfil, clave)` es el mecanismo central real. Mismo criterio que ya mostraba `PermisosTab.tsx` (sin cambiarlo):

1. `admin` siempre tiene todos los permisos.
2. Si el perfil tiene una fila en `usuario_permisos` para esa clave, esa excepción manda (otorgado o denegado), sin importar el rol.
3. Si no, el default es "otorgado si CUALQUIERA de sus roles lo otorga" en `rol_permisos`.

**Piloto migrado**: `puedeVerLiquidacion` (margen/ganancia de Expedientes, Gestoría, Liquidaciones, Tesorería → Expedientes) — antes era `["admin", "finanzas", "gestoria"].includes(rol)` repetido igual en 4 `page.tsx`. Ahora los 4 llaman `tienePermiso(supabase, miPerfil, "ver_liquidacion")`, con la clave sembrada en `permisos_definiciones`/`rol_permisos` (ver `migraciones/sql_permiso_ver_liquidacion.sql`) con el mismo default que tenía hardcodeado — no cambia el acceso de nadie hasta que alguien lo edite a mano en la pantalla de Permisos.

**Quedan ~28 chequeos de rol sin migrar** (todos los `roles.includes(...)`/`roles.some(...)` que no sean `puedeVerLiquidacion`). Si migrás uno nuevo: 1) elegí una clave descriptiva, 2) sembrala en `permisos_definiciones` + `rol_permisos` con el mismo default que el código hardcodeado tenía (para no cambiar el acceso de nadie de golpe), 3) reemplazá el chequeo por `await tienePermiso(supabase, perfil, clave)` en el `page.tsx` (Server Component) y pasalo como prop al cliente, igual que `puedeVerLiquidacion` — no llamar a `tienePermiso` desde un componente `"use client"` directo, hace queries a la base.

## No tocar sin revisar el resto

- `lead_routing_activo` sí está consumido (por una función de base de datos, `migraciones/sql_fix_panel_v2_en_funciones_2.sql`) — no es del mismo tipo de bug, es el ejemplo de cómo se ve un toggle que sí funciona.
