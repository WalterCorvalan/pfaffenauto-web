# Visitas — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Dos formularios públicos, un solo endpoint

Una visita se puede agendar desde 2 lugares distintos del sitio público, y ambos postean al mismo endpoint — **si tocás uno, revisá el otro**:

- **`components/forms/AgendarCitaForm.tsx`** — sección "Agenda abierta" del sitio, formulario general (elegís sucursal, auto opcional, fecha, horario).
- **`components/forms/AgendarVisitaForm.tsx`** — botón "Agendar Visita" en cada tarjeta de auto del stock/catálogo, ya viene con el auto precargado.
- Ambos hacen `POST` a **`app/api/panel-v2/visitas/route.ts`**, mismo payload (`vehiculo_id`, `nombre_cliente`, `telefono_cliente`, `fecha_visita`, `horario_visita`, `sucursal`, `turnstileToken`).

## Horarios ocupados — RPC `visitas_horarios_ocupados`

Antes de dejar elegir un horario, hay que consultar `supabase.rpc("visitas_horarios_ocupados", { p_sucursal, p_fecha })` y deshabilitar los que ya están tomados. **El endpoint no valida esto server-side** — inserta directo en `visitas` sin constraint de unicidad por sucursal+fecha+hora, así que si un formulario nuevo (o uno de estos dos) no hace el chequeo client-side, se pueden pisar dos visitas a la misma sucursal el mismo día y hora sin que nadie se entere hasta después.

(Bug corregido: `AgendarVisitaForm.tsx` no hacía este chequeo, `AgendarCitaForm.tsx` sí — ahora los dos lo hacen.)

## No tocar sin revisar el resto

- Si agregás un tercer punto de entrada para agendar una visita (ej. desde WhatsApp/Rodi), hacelo pasar por el mismo endpoint y el mismo chequeo de horarios ocupados — no reimplementar el insert a mano.
