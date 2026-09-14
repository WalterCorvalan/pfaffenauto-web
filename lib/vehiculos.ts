const REGEX_DIACRITICOS = new RegExp("[̀-ͯ]", "g");

// Compara nombres de marca contra el valor real de vehiculos.marca sin
// depender de que coincidan letra a letra (tildes, mayúsculas, "Citroën" vs
// "Citroen", etc.) — deja solo letras/números en minúscula sin acentos.
export function normalizarMarca(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(REGEX_DIACRITICOS, "")
    .replace(/[^a-z0-9]/g, "");
}

// Columnas públicas de "vehiculos" para queries del lado público. Nunca incluir
// precio_costo_ars/usd, observaciones_internas ni vendedor_asignado_id — son
// internos y no deben viajar al cliente (select("*") los expone sin querer).
export const CAMPOS_VEHICULO_PUBLICO =
  "id, marca, modelo, anio, km, condicion, tipo, segmento, estado, slug, precio_publicado_ars, precio_publicado_usd, traccion, potencia_cv, cantidad_plazas, transmision, combustible, destacado, fotos, sucursales!vehiculos_sucursal_id_fkey ( nombre )" as const;

// Ficha de auto (/catalogo/[slug]): igual que arriba + datos de contacto de la sucursal.
export const CAMPOS_VEHICULO_DETALLE =
  "id, marca, modelo, anio, km, condicion, tipo, segmento, estado, slug, precio_publicado_ars, precio_publicado_usd, traccion, potencia_cv, cantidad_plazas, transmision, combustible, destacado, fotos, sucursales!vehiculos_sucursal_id_fkey ( nombre, direccion, telefono:telefono_encargado )" as const;

// Mismo criterio que StockClient.tsx (aRevisar): "listo para publicar en
// MercadoLibre", no "listo para vender" -- reusado por la Ficha rápida/completa
// de Stock para no duplicar la lógica de qué falta preparar.
export function vehiculoARevisar(v: { publicado_ml?: boolean | null; fotos?: string[] | null; precio_venta?: number | null }): boolean {
  return !v.publicado_ml || (v.fotos?.length ?? 0) === 0 || !v.precio_venta;
}
export function vehiculoPendientes(v: { publicado_ml?: boolean | null; fotos?: string[] | null; precio_venta?: number | null }): string[] {
  const items: string[] = [];
  if (!v.publicado_ml) items.push("Sin publicar en ML");
  if ((v.fotos?.length ?? 0) === 0) items.push("Sin foto");
  if (!v.precio_venta) items.push("Cargar peritaje");
  return items;
}