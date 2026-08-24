import type { ShowroomVehicle } from "./types";

// Tamaño de caja placeholder por tipo — no tenemos dimensiones reales en la
// DB, esto es una aproximación razonable hasta que carguemos modelos .glb.
const DIMENSIONES_POR_TIPO: Record<string, { largo: number; ancho: number; alto: number }> = {
  "Pick-up": { largo: 5.3, ancho: 1.9, alto: 1.8 },
  Camioneta: { largo: 5.3, ancho: 1.9, alto: 1.8 },
  "Todo Terreno | SUV": { largo: 4.6, ancho: 1.85, alto: 1.7 },
  Utilitarios: { largo: 4.8, ancho: 1.8, alto: 2.0 },
  "Van | Mini-Van": { largo: 4.9, ancho: 1.85, alto: 1.9 },
  default: { largo: 4.3, ancho: 1.75, alto: 1.5 },
};

// Color placeholder neutro — el showroom es de la sucursal, no de una marca,
// así que no tiñe las cajas según a quién pertenece cada auto.
const COLOR_PLACEHOLDER = "#8a8f9c";

// Fila de vehículos reales del stock (Disponible/Reservado) transformados al
// formato que ya consume el showroom 3D — cada unidad física es una caja.
export function vehiculoRealAShowroom(v: any, marca: string): ShowroomVehicle {
  const esCeroKm = v.kilometraje === 0;
  const precioTexto = v.precio_publicado_usd
    ? `US$ ${Number(v.precio_publicado_usd).toLocaleString("en-US")}`
    : `$${Number(v.precio_publicado_ars || 0).toLocaleString("es-AR")}`;

  const specs = [
    `${v.anio} · ${esCeroKm ? "0km" : `${Number(v.kilometraje).toLocaleString("es-AR")} km`}`,
    precioTexto,
    v.transmision ? `Transmisión ${v.transmision}` : null,
    v.sucursales?.nombre ? `Sucursal: ${v.sucursales.nombre}` : null,
  ].filter(Boolean) as string[];

  return {
    id: v.id,
    marca,
    nombre: `${v.marca} ${v.modelo}`,
    subtitulo: `${v.anio} · ${esCeroKm ? "0km" : "Usado"}`,
    colorPlaceholder: COLOR_PLACEHOLDER,
    dimensiones: DIMENSIONES_POR_TIPO[v.tipo] ?? DIMENSIONES_POR_TIPO.default,
    image: v.multimedia_vehiculos?.[0]?.url_archivo || "/logo.png",
    specs,
    whatsappLink: `https://wa.me/5491121907000?text=${encodeURIComponent(
      `Hola, quiero cotizar el ${v.marca} ${v.modelo} ${v.anio} que vi en el showroom.`
    )}`,
    disponibles: 1,
  };
}
