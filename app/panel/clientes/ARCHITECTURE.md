# Clientes — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Visibilidad por vendedor

Configuración → Empresa tiene un toggle **"Cada vendedor ve solo sus clientes"** (`configuracion_empresa.cada_vendedor_ve_solo_sus_clientes`). Cuando está prendido, `app/panel/clientes/page.tsx` filtra la query server-side a `vendedor_id = usuario actual` para cualquiera que no tenga rol `admin` o `recepcion` — los clientes sin vendedor asignado quedan afuera también (no le aparecen a ningún vendedor, solo a admin/recepción).

**Bug corregido**: el toggle se guardaba desde que existe la pantalla, pero nada lo leía — prenderlo no cambiaba nada. Si agregás un setting nuevo en Configuración → Empresa, verificá que algo lo consuma antes de darlo por terminado (mismo patrón se repitió con "Mi resumen" en Mi Espacio).

**Alcance actual**: el filtro solo se aplica en este listado (`/panel/clientes`). Otros lugares que también muestran clientes (ej. el `<select>` de "Cliente del CRM" en `NuevaVentaModal.tsx`, que recibe la lista completa por props desde `app/panel/ventas/page.tsx`) **no** respetan este toggle todavía — es una decisión de producto pendiente si se quiere extender el mismo criterio ahí.

## No tocar sin revisar el resto

- Si el toggle está prendido, `clientesIniciales` que llega a `ClientesClient.tsx` ya viene filtrado — no asumir que siempre es "todos los clientes" al usarlo para deduplicar o comparar.
