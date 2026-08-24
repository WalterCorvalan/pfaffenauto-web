import { NextResponse } from "next/server";

let cache: { compra: number; venta: number; obtenidoEn: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.obtenidoEn < TTL_MS) {
    return NextResponse.json({ compra: cache.compra, venta: cache.venta });
  }

  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/blue", { cache: "no-store" });
    if (!res.ok) throw new Error("dolarapi respondió " + res.status);
    const data = await res.json();
    const compra = Number(data.compra);
    const venta = Number(data.venta);
    if (!compra || !venta) throw new Error("Cotización blue inválida.");

    cache = { compra, venta, obtenidoEn: Date.now() };
    return NextResponse.json({ compra, venta });
  } catch (err) {
    if (cache) return NextResponse.json({ compra: cache.compra, venta: cache.venta });
    return NextResponse.json({ error: "No se pudo obtener la cotización del dólar blue." }, { status: 502 });
  }
}
