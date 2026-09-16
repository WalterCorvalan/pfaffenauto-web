# Autorizaciones — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo.

## Qué es

Bandeja centralizada de aprobación para acciones riesgosas de otros módulos (ej. comisiones/bonos, ediciones de cotizaciones ya aprobadas). Un módulo que necesite este gate inserta una fila en `autorizaciones` (`riesgo`, `requiere_pin`, `datos_antes`/`datos_despues`, `descripcion`) en vez de aplicar el cambio directo — ver `app/panel/comisiones/ARCHITECTURE.md` y `app/panel/cotizaciones/ARCHITECTURE.md` para los dos casos reales que ya la usan.

## Resolución

`resolver_autorizacion` (RPC, no está en este repo) es el único camino para aprobar/rechazar — aplica el cambio real (`datos_despues`) del lado del servidor si se aprueba, valida el PIN si `requiere_pin`, y deja todo trazado (`resuelto_por`, `resuelto_en`, `motivo_rechazo`). El cliente (`AutorizacionesClient.tsx`) nunca aplica el cambio subyacente él mismo, solo llama al RPC.

## PIN de emergencia

`autorizaciones_pin` (un PIN por perfil admin) y `autorizaciones_pin_usos` (auditoría de cada uso) — pensado para que un admin dicte el PIN por teléfono cuando no puede entrar al panel. Tab "PIN de emergencia" solo visible para `soyAdmin`.

## Real time (agregado)

`AutorizacionesClient.tsx` se suscribe a `postgres_changes` (`event: "*"`) sobre la tabla `autorizaciones` y refetchea pendientes + histórico completos ante cualquier cambio (mismo criterio que Reclamos/Expedientes — sin merge parcial). Importante: esto es lo que hace que una solicitud nueva aparezca en la bandeja del admin sin que tenga que refrescar — necesario después de haber cerrado el bypass de autoaprobación en Comisiones (ver su ARCHITECTURE.md), donde el hueco real era justo que nadie veía la solicitud pendiente a tiempo.

## No tocar sin revisar el resto

- Si sumás un módulo nuevo que dispare autorizaciones, no hace falta tocar nada acá — solo insertar en `autorizaciones` con el shape correcto y este módulo la muestra sola.
- No agregues una vía alternativa para aplicar el `datos_despues` desde el cliente — eso reabriría el mismo tipo de bypass que se cerró en Comisiones/Cotizaciones. Todo cambio real tiene que pasar por `resolver_autorizacion`.
