import { NextResponse } from "next/server";
import { r2Configurado, subirArchivoR2 } from "@/lib/storage/r2";

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

    let publicUrl: string;

    if (r2Configurado()) {
      publicUrl = await subirArchivoR2(buffer, `documentacion/${uniqueFileName}`, file.type || "application/octet-stream");
    } else {
      const storageEndpoint = process.env.BUNNY_STORAGE_ENDPOINT;
      const storageZone = process.env.BUNNY_STORAGE_ZONE;
      const uploadUrl = `${storageEndpoint}/${storageZone}/documentacion/${uniqueFileName}`;

      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          AccessKey: process.env.BUNNY_API_KEY as string,
          "Content-Type": "application/octet-stream",
        },
        body: new Uint8Array(buffer),
      });

      if (!response.ok) {
        throw new Error(`Error de Bunny: ${response.statusText}`);
      }

      publicUrl = `${process.env.BUNNY_CDN_URL}/documentacion/${uniqueFileName}`;
    }

    return NextResponse.json({ publicUrl });
  } catch (error) {
    console.error("Error en /api/upload-documento:", error);
    return NextResponse.json({ error: "Error interno subiendo el archivo" }, { status: 500 });
  }
}
