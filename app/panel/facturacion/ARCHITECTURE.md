# Facturación — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Qué es (y qué NO es)

Este módulo es solo el estado de **facturación de compra** de cada vehículo del stock — si la agencia tiene la factura de quien le vendió el auto, con importe/número/emisor/archivo. **No es** facturación de venta al cliente (eso hoy vive suelto en `boletos`, que no es un comprobante fiscal) ni un reemplazo de `Finanzas > AFIP/IVA`.

## Tabla

Todo vive en `public.vehiculos` (mismos campos que carga `NuevoVehiculoModal.tsx` en Stock, editable acá sin ir a Stock): `facturado`, `factura_importe`, `factura_numero`, `factura_emisor`, `factura_archivo_url`, y (agregados para conectar con AFIP/IVA) `factura_fecha`, `factura_tipo_comprobante` (`A`/`B`/`C`/`Exenta`), `factura_iva_pct`. Estos últimos tres son opcionales — si no se cargan, el vehículo sigue apareciendo como "Facturado" igual, solo que no se conecta con AFIP/IVA.

## Conexiones

- **Stock (`estado` del vehículo)**: `FacturacionClient.tsx` cruza `facturado` contra `estado === "vendido"` para marcar "Vendido sin facturar" (banner rojo arriba + badge distinto en la tabla) — es el caso más caro (no hay cómo justificar el costo de compra ante AFIP si el auto ya se vendió). Es un cruce de solo lectura, no cambia nada de Stock.
- **Finanzas > AFIP/IVA (`AfipIvaTab.tsx`)**: si se cargó `factura_fecha` + `factura_iva_pct`, esa compra aparece en la sección "Facturas de compra de vehículos del período" de AFIP/IVA (filtrada por el mismo período elegido ahí). Es informativa — **no se suma** al IVA cobrado/pagado que sigue calculándose 100% desde `movimientos_caja`. El fetch de esto en `finanzas/page.tsx` está gateado por `puedeVerLiquidacion` (ver `finanzas/ARCHITECTURE.md`).

## No tocar sin revisar el resto

- Si renombrás o quitás `factura_fecha`/`factura_tipo_comprobante`/`factura_iva_pct`, la sección de AFIP/IVA que los lee (`finanzas/tabs/AfipIvaTab.tsx`) deja de recibir datos — no rompe nada (el filtro `factura_fecha` no null los deja afuera), pero queda huérfana.
- El badge "Vendido sin facturar" depende de `vehiculos.estado === "vendido"` — si ese string cambia en otro lado (Stock usa el mismo valor), actualizar acá también.
