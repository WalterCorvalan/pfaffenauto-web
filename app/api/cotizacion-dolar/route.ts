import { NextResponse } from "next/server";
import { obtenerCotizacionDolar } from "@/lib/dolarBlueConfig";

// Precio de dólar EFECTIVO: el manual (Financiaciones → Configuración) si
// está activado, si no el blue en vivo -- es el que usan los cálculos
// reales de la app (catálogo público, simuladores de financiación). No
// confundir con /api/dolar-blue, que es siempre el blue real, sin importar
// la config manual (esa es la referencia fija que se ve en el ticker).
export async function GET() {
  try {
    const { compra, venta, manual } = await obtenerCotizacionDolar();
    return NextResponse.json({ compra, venta, manual });
  } catch {
    return NextResponse.json({ error: "No se pudo obtener la cotización del dólar." }, { status: 502 });
  }
}
