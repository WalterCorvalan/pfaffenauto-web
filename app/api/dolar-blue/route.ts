import { NextResponse } from "next/server";
import { obtenerDolarBlue } from "@/lib/dolarBlue";

export async function GET() {
  try {
    const { compra, venta } = await obtenerDolarBlue();
    return NextResponse.json({ compra, venta });
  } catch {
    return NextResponse.json({ error: "No se pudo obtener la cotización del dólar blue." }, { status: 502 });
  }
}
