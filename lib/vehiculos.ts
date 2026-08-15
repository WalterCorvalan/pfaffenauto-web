// Columnas públicas de "vehiculos" para queries del lado público. Nunca incluir
// precio_costo_ars/usd, observaciones_internas ni vendedor_asignado_id — son
// internos y no deben viajar al cliente (select("*") los expone sin querer).
export const CAMPOS_VEHICULO_PUBLICO =
  "id, marca, modelo, anio, kilometraje, tipo, segmento, estado, slug, precio_publicado_ars, precio_publicado_usd, traccion, potencia_cv, cantidad_plazas, transmision, tipo_combustible, destacado, multimedia_vehiculos ( url_archivo ), sucursales!vehiculos_sucursal_id_fkey ( nombre )" as const;

// Ficha de auto (/catalogo/[slug]): igual que arriba + datos de contacto de la sucursal.
export const CAMPOS_VEHICULO_DETALLE =
  "id, marca, modelo, anio, kilometraje, tipo, segmento, estado, slug, precio_publicado_ars, precio_publicado_usd, traccion, potencia_cv, cantidad_plazas, transmision, tipo_combustible, destacado, multimedia_vehiculos ( url_archivo, tipo, orden ), sucursales!vehiculos_sucursal_id_fkey ( nombre, direccion, telefono )" as const;