import { NextResponse } from "next/server";
import { obtenerDolarBlue } from "@/lib/dolarBlue";

// SIEMPRE el blue real de dolarapi.com, nunca el precio manual -- es la
// referencia que se ve arriba de todo en el panel (TopTicker.tsx) y tiene
// que seguir siendo el dólar real pase lo que pase con la configuración
// manual. Para el precio que efectivamente usan los cálculos de la app
// (que si respeta el manual cuando está activado), ver /api/cotizacion-dolar.
export async function GET() {
  try {
    const { compra, venta } = await obtenerDolarBlue();
    return NextResponse.json({ compra, venta });
  } catch {
    return NextResponse.json({ error: "No se pudo obtener la cotización del dólar blue." }, { status: 502 });
  }
}
