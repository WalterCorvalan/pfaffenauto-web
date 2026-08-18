import { NextResponse } from "next/server";
import { subirArchivoR2 } from "@/lib/storage/r2";

// Adjuntos de documentación de venta (título, formularios, cédulas, etc.)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se encontró ningún archivo." }, { status: 400 });
    }

    const MAX_BYTES = 25 * 1024 * 1024; // 25MB, son documentos/fotos, no video
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "El archivo pesa demasiado (máximo 25MB)." }, { status: 400 });
    }

    const buffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const uniqueFileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}-${cleanFileName}`;

    const publicUrl = await subirArchivoR2(buffer, `documentacion/${uniqueFileName}`, file.type || "application/octet-stream");

    return NextResponse.json({ publicUrl });
  } catch (error) {
    console.error("Error en /api/upload-documento:", error);
    return NextResponse.json({ error: "Error interno subiendo el archivo" }, { status: 500 });
  }
}
