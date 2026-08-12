import { NextResponse } from "next/server";

// Fotos/videos que manda el cliente en el cotizador cuando no puede venir a sucursal.
// Van a Bunny por ahora (mismo proveedor que el resto del sitio); si el día de mañana
// se migra a Cloudflare, este es el único archivo que hay que tocar.
export async function POST(request: Request) {
  try {
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

    const storageEndpoint = process.env.BUNNY_STORAGE_ENDPOINT;
    const storageZone = process.env.BUNNY_STORAGE_ZONE;
    const uploadUrl = `${storageEndpoint}/${storageZone}/cotizaciones/${uniqueFileName}`;

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

    const publicUrl = `${process.env.BUNNY_CDN_URL}/cotizaciones/${uniqueFileName}`;
    return NextResponse.json({ publicUrl });
  } catch (error) {
    console.error("Error en /api/upload-cotizacion:", error);
    return NextResponse.json({ error: "Error interno subiendo el archivo" }, { status: 500 });
  }
}
