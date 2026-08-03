import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se encontró ningún archivo." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Limpiamos el nombre del archivo para evitar errores en las URLs
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const uniqueFileName = `${Date.now()}-${cleanFileName}`;
    
    // Armamos la ruta hacia Bunny.net
    const storageEndpoint = process.env.BUNNY_STORAGE_ENDPOINT;
    const storageZone = process.env.BUNNY_STORAGE_ZONE;
    const uploadUrl = `${storageEndpoint}/${storageZone}/vehiculos/${uniqueFileName}`;

    // Subimos el archivo a Bunny.net de forma segura desde el backend
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "AccessKey": process.env.BUNNY_API_KEY as string,
        "Content-Type": "application/octet-stream",
      },
      body: buffer,
    });

    if (!response.ok) {
      throw new Error(`Error de Bunny: ${response.statusText}`);
    }

    // Armamos la URL pública que se guardará en tu base de datos
    const publicUrl = `${process.env.BUNNY_CDN_URL}/vehiculos/${uniqueFileName}`;
    
    // Devolvemos la URL al frontend
    return NextResponse.json({ publicUrl });

  } catch (error) {
    console.error("Error en /api/upload:", error);
    return NextResponse.json({ error: "Error interno subiendo la imagen" }, { status: 500 });
  }
}