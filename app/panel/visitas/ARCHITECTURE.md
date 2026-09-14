# Visitas — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Cuatro puntos de entrada, un mismo riesgo de choque de horario

Una visita se puede crear desde 4 lugares — **si tocás uno, revisá los otros 3**:

- **`components/forms/AgendarCitaForm.tsx`** — sección "Agenda abierta" del sitio, formulario general (elegís sucursal, auto opcional, fecha, horario). `POST` a `app/api/panel-v2/visitas/route.ts`.
- **`components/forms/AgendarVisitaForm.tsx`** — botón "Agendar Visita" en cada tarjeta de auto del stock/catálogo, ya viene con el auto precargado. Mismo endpoint.
- **`app/api/panel-v2/webhooks/whatsapp/[token]/route.ts`** — cuando el bot de WhatsApp detecta día+horario confirmado en la charla, inserta directo en `visitas` (no pasa por el endpoint de arriba).
- **`app/api/panel-v2/rodi/mensaje/route.ts`** — mismo caso pero para el bot de Rodi.

Los 2 formularios mandan el mismo payload al mismo endpoint (`vehiculo_id`, `nombre_cliente`, `telefono_cliente`, `fecha_visita`, `horario_visita`, `sucursal`, `turnstileToken`); los 2 bots insertan directo a la tabla con sus propios datos (nombre/teléfono del contacto de la conversación, vehículo si lo mencionó).

## Horarios ocupados — RPC `visitas_horarios_ocupados`

Antes de confirmar un horario, hay que consultar `supabase.rpc("visitas_horarios_ocupados", { p_sucursal, p_fecha })`. **El insert nunca lo valida server-side** — no hay constraint de unicidad por sucursal+fecha+hora en la tabla — así que la responsabilidad de no pisar un horario recae en cada uno de los 4 puntos de entrada:

- Los 2 formularios deshabilitan los horarios ocupados en el `<select>` antes de dejar enviar (bug corregido: `AgendarVisitaForm.tsx` no lo hacía, `AgendarCitaForm.tsx` sí — ahora los dos).
- Los 2 bots no pueden reofrecerle otro horario al cliente en tiempo real (la charla ya terminó) — consultan el RPC igual, y si hay choque, **crean la visita de todos modos** (mejor un conflicto a mano que perder el lead) pero mandan una alerta de prioridad alta al vendedor/encargados para que reagenden una de las dos.

Si agregás un quinto punto de entrada, seguí el mismo patrón: consultar el RPC antes de insertar, y decidir explícitamente qué hacer ante un choque (bloquear como los formularios, o avisar como los bots) — nunca insertar a ciegas.
