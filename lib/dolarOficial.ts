// Cotización del dólar oficial (dolarapi.com, gratis, sin key) — usada para
// convertir comparables de mercado publicados en USD a ARS de forma determinista,
// en vez de dejar que la IA "adivine" la conversión.
let cache: { valor: number; obtenidoEn: number } | null = null;
const TTL_MS = 30 * 60 * 1000; // 30 min alcanza, la cotización oficial no cambia tan seguido

export async function obtenerDolarOficial(): Promise<number> {
  if (cache && Date.now() - cache.obtenidoEn < TTL_MS) return cache.valor;

  const res = await fetch("https://dolarapi.com/v1/dolares/oficial", { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo obtener la cotización del dólar oficial.");
  const data = await res.json();
  const valor = Number(data.venta);
  if (!valor) throw new Error("Cotización del dólar oficial inválida.");

  cache = { valor, obtenidoEn: Date.now() };
  return valor;
}
