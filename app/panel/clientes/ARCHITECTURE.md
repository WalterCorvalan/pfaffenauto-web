# Clientes — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Visibilidad por vendedor

Configuración → Empresa tiene un toggle **"Cada vendedor ve solo sus clientes"** (`configuracion_empresa.cada_vendedor_ve_solo_sus_clientes`). Cuando está prendido, `app/panel/clientes/page.tsx` filtra la query server-side a `vendedor_id = usuario actual` para cualquiera que no tenga rol `admin` o `recepcion` — los clientes sin vendedor asignado quedan afuera también (no le aparecen a ningún vendedor, solo a admin/recepción).

**Bug corregido**: el toggle se guardaba desde que existe la pantalla, pero nada lo leía — prenderlo no cambiaba nada. Si agregás un setting nuevo en Configuración → Empresa, verificá que algo lo consuma antes de darlo por terminado (mismo patrón se repitió con "Mi resumen" en Mi Espacio).

**Alcance actual**: el filtro solo se aplica en este listado (`/panel/clientes`). Otros lugares que también muestran clientes (ej. el `<select>` de "Cliente del CRM" en `NuevaVentaModal.tsx`, que recibe la lista completa por props desde `app/panel/ventas/page.tsx`) **no** respetan este toggle todavía — es una decisión de producto pendiente si se quiere extender el mismo criterio ahí.

## Conteo de operaciones por cliente

Una venta puede no haber quedado vinculada a una ficha de cliente (`ventas.cliente_id` null) — en ese caso se rescata comparando `ventas.comprador_dni` contra `clientes.dni_cuit` (`ventasPorCliente` en `ClientesClient.tsx`, mismo criterio que ya usaba el tab Ranking). **Bug corregido**: el badge "N operación(es)" de la lista principal (`opsMap`) contaba solo por `cliente_id`, sin este rescate por DNI — un cliente con una venta rescatada mostraba "0" en la lista aunque Ranking, para ese mismo cliente, sí la contara. Ahora `opsMap` se deriva de `ventasPorCliente` en vez de tener su propio loop. Si agregás un contador nuevo sobre `ventas` en este módulo, reusá `ventasPorCliente` en vez de iterar `ventas` de cero — evita que se repita el mismo desfasaje.

## Bug corregido: encargado veía Clientes vacío

`esAdminORecepcion` (ahora `esAdminRecepcionOEncargado`) solo incluía `admin` y `recepcion`. Con el toggle "cada vendedor ve solo sus clientes" prendido, el `encargado` quedaba tratado como un vendedor común y se le filtraba `vendedor_id = su propio id` — como el encargado normalmente no tiene clientes asignados como vendedor, la lista le quedaba vacía (podía entrar al módulo, pero sin datos). Corregido agregando `encargado` a la lista de roles que ven la cartera completa, igual que admin/recepción.

## Vista "lista" — tarjetas estilo Stock, no `TablaResponsiva`

La vista principal (`vista === "lista"`, la que ve todo el mundo al entrar) dejó de usar `TablaResponsiva` y pasó a ser una lista de tarjetas (avatar + nombre + contacto + badges en una fila, acciones a la derecha), calcada del patrón de `vista === "lista"` de `StockClient.tsx` — mismo contenedor (`rounded-2xl divide-y`), mismo layout de fila. Es un pedido explícito de diseño para que las dos pantallas se vean consistentes. `renderClienteCell()` y el import de `TablaResponsiva`/`ColumnaTabla` se borraron por quedar sin uso — si necesitás la vista de tabla clásica con columnas, mirá `vista === "tabla_detallada"` (usa `<table>` directo, no `TablaResponsiva`), no revivas el componente viejo.

## No tocar sin revisar el resto

- Si el toggle está prendido, `clientesIniciales` que llega a `ClientesClient.tsx` ya viene filtrado — no asumir que siempre es "todos los clientes" al usarlo para deduplicar o comparar.
