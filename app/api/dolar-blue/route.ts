import { NextResponse } from "next/server";
import { obtenerCotizacionDolar } from "@/lib/dolarBlueConfig";

export async function GET() {
  try {
    const { compra, venta, manual } = await obtenerCotizacionDolar();
    return NextResponse.json({ compra, venta, manual });
  } catch {
    return NextResponse.json({ error: "No se pudo obtener la cotización del dólar." }, { status: 502 });
  }
}
