// Escala de descuento sobre el precio que el cliente dice esperar por su
// auto, según los km — reemplaza la estimación con IA (buscaba comparables
// de mercado) por una regla fija que el equipo definió.
const TRAMOS = [
  { hasta: 50_000, pct: 8 },
  { hasta: 80_000, pct: 10 },
  { hasta: 100_000, pct: 12 },
  { hasta: 120_000, pct: 14 },
  { hasta: 180_000, pct: 16 },
  { hasta: Infinity, pct: 20 },
];

export function descuentoPctPorKm(km: number): number {
  const tramo = TRAMOS.find((t) => km <= t.hasta);
  return tramo ? tramo.pct : 20;
}

export function calcularOferta(precioEsperado: number, km: number): { descuentoPct: number; oferta: number } {
  const descuentoPct = descuentoPctPorKm(km);
  const oferta = Math.round(precioEsperado * (1 - descuentoPct / 100));
  return { descuentoPct, oferta };
}
