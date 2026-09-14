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

Si agregás un checkbox/setting nuevo acá, antes de darlo por terminado **verificá que algún query/proceso lo lea** — guardarlo en la tabla no alcanza.

## No tocar sin revisar el resto

- `lead_routing_activo` sí está consumido (por una función de base de datos, `migraciones/sql_fix_panel_v2_en_funciones_2.sql`) — no es del mismo tipo de bug, es el ejemplo de cómo se ve un toggle que sí funciona.
