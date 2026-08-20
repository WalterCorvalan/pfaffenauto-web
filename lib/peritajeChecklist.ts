// Checklist de peritaje: calcado de la hoja física "Peritaje del Usado" que ya
// usa el equipo en papel. Única fuente de verdad: se usa tanto para sembrar los
// ítems de un peritaje nuevo como para agruparlos en pantalla. Si se agrega/saca
// un ítem acá, los peritajes YA creados no cambian (quedan con los ítems que
// tenían al momento de iniciarse).
export const CHECKLIST_PERITAJE: { categoria: string; items: string[] }[] = [
  {
    categoria: "Motor",
    items: ["Estado general"],
  },
  {
    categoria: "Transmisión",
    items: ["Embrague", "Caja", "Tren delantero"],
  },
  {
    categoria: "Electricidad",
    items: ["Techo", "Diversos"],
  },
  {
    categoria: "Elementos de seguridad",
    items: ["Frenos", "Suspensión", "Dirección", "Cinturón de seguridad"],
  },
  {
    categoria: "Aspecto",
    items: ["Chapa", "Pintura", "Tapicería"],
  },
  {
    categoria: "Observaciones",
    items: ["Prueba en ruta"],
  },
  {
    // Igual que el resto de la hoja pero con un cuarto estado ("Recapable") y
    // un campo de marca — se maneja aparte en la UI, no es un ítem más del B/R/M.
    categoria: "Neumáticos",
    items: ["Delantero derecho", "Delantero izquierdo", "Trasero derecho", "Trasero izquierdo", "Rueda de auxilio"],
  },
];

export const ESTADOS_ITEM_PERITAJE = ["Bueno", "Regular", "Malo"] as const;
export type EstadoItemPeritaje = (typeof ESTADOS_ITEM_PERITAJE)[number];

// Los neumáticos, además de B/R/M, tienen un cuarto estado en el papel.
export const ESTADO_NEUMATICO_RECAPABLE = "Recapable";

// Accesorios: checklist Sí/No de la hoja física — se guarda como jsonb en
// peritajes.accesorios, no como ítems (no tienen estado B/R/M, son booleanos).
export const ACCESORIOS_PERITAJE = [
  "Alarma", "Rueda de auxilio", "Crique", "Llave de rueda", "Calefactor", "Aire acondicionado",
  "Radio reproductor", "Reproductor CD", "Llantas especiales", "Reloj", "Fundas", "Air Bag", "A.B.S.",
] as const;

// Puntaje informativo, no cambia ningún precio automáticamente — es solo una guía.
export function calcularPuntaje(items: { estado: string | null }[]): number | null {
  const evaluados = items.filter((i) => i.estado && i.estado !== "No aplica");
  if (evaluados.length === 0) return null;
  const puntos: Record<string, number> = { Bueno: 100, Regular: 50, Malo: 0, Recapable: 50 };
  const suma = evaluados.reduce((acc, i) => acc + (puntos[i.estado!] ?? 0), 0);
  return Math.round(suma / evaluados.length);
}
