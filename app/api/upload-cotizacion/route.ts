import { NextResponse } from "next/server";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { subirArchivoR2 } from "@/lib/storage/r2";

// Fotos/videos que manda el cliente en el cotizador cuando no puede venir a sucursal.
export async function POST(request: Request) {
  try {
    const limite = rateLimit(ipDesdeRequest(request), { limite: 20, ventanaMs: 10 * 60 * 1000 });
    if (!limite.ok) {
      return NextResponse.json({ error: "Demasiados archivos subidos. Esperá un momento." }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se encontró ningún archivo." }, { status: 400 });
    }

    const MAX_BYTES = 100 * 1024 * 1024; // 100MB, cubre fotos y videos cortos de celular
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "El archivo pesa demasiado (máximo 100MB)." }, { status: 400 });
    }

    const buffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const uniqueFileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}-${cleanFileName}`;

    const publicUrl = await subirArchivoR2(buffer, `cotizaciones/${uniqueFileName}`, file.type || "application/octet-stream");

    return NextResponse.json({ publicUrl });
  } catch (error) {
    console.error("Error en /api/upload-cotizacion:", error);
    return NextResponse.json({ error: "Error interno subiendo el archivo" }, { status: 500 });
  }
}
