// Cotización del dólar blue (dolarapi.com, gratis, sin key) — usada para
// mostrar precios en ARS de vehículos publicados en USD en el sitio público.
let cache: { compra: number; venta: number; obtenidoEn: number } | null = null;
const TTL_MS = 60 * 60 * 1000;

export async function obtenerDolarBlue(): Promise<{ compra: number; venta: number }> {
  if (cache && Date.now() - cache.obtenidoEn < TTL_MS) return { compra: cache.compra, venta: cache.venta };

  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/blue", { cache: "no-store" });
    if (!res.ok) throw new Error("dolarapi respondió " + res.status);
    const data = await res.json();
    const compra = Number(data.compra);
    const venta = Number(data.venta);
    if (!compra || !venta) throw new Error("Cotización blue inválida.");

    cache = { compra, venta, obtenidoEn: Date.now() };
    return { compra, venta };
  } catch (err) {
    if (cache) return { compra: cache.compra, venta: cache.venta };
    throw err;
  }
}
