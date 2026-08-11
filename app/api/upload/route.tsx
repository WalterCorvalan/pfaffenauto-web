import { NextResponse } from "next/server";
import { isRemoveBgConfigurado, quitarFondo } from "@/lib/removeBg";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se encontró ningún archivo." }, { status: 400 });
    }

    let buffer: Buffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));

    // Fotos de autos: recorte automático de fondo → fondo gris estudio parejo en todas las tomas
    if (isRemoveBgConfigurado()) {
      try {
        buffer = await quitarFondo(buffer, file.name);
      } catch (err) {
        console.error("[remove.bg] no se pudo procesar, se sube la foto original:", err);
      }
    }

    // Limpiamos el nombre del archivo
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const uniqueFileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}-${cleanFileName}`;
    
    // Armamos la ruta hacia Bunny.net
    const storageEndpoint = process.env.BUNNY_STORAGE_ENDPOINT;
    const storageZone = process.env.BUNNY_STORAGE_ZONE;
    const uploadUrl = `${storageEndpoint}/${storageZone}/vehiculos/${uniqueFileName}`;

    // Subimos el archivo
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "AccessKey": process.env.BUNNY_API_KEY as string,
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      throw new Error(`Error de Bunny: ${response.statusText}`);
    }

    // Devolvemos la URL pública final
    const publicUrl = `${process.env.BUNNY_CDN_URL}/vehiculos/${uniqueFileName}`;
    
    return NextResponse.json({ publicUrl });

  } catch (error) {
    console.error("Error en /api/upload:", error);
    return NextResponse.json({ error: "Error interno subiendo la imagen" }, { status: 500 });
  }
}