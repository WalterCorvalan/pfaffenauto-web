import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { r2Configurado, subirArchivoR2 } from "@/lib/storage/r2";

const MAX_MB = 15;

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se encontró ningún archivo." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes." }, { status: 400 });
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return NextResponse.json({ error: `La imagen pesa demasiado (máximo ${MAX_MB}MB).` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Limpiamos el nombre del archivo para evitar errores en las URLs
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const uniqueFileName = `${Date.now()}-${cleanFileName}`;
    
    let publicUrl: string;

    if (r2Configurado()) {
      publicUrl = await subirArchivoR2(buffer, `vehiculos/${uniqueFileName}`, file.type);
    } else {
      // Fallback a Bunny mientras no estén las credenciales de R2 cargadas
      const storageEndpoint = process.env.BUNNY_STORAGE_ENDPOINT;
      const storageZone = process.env.BUNNY_STORAGE_ZONE;
      const uploadUrl = `${storageEndpoint}/${storageZone}/vehiculos/${uniqueFileName}`;

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

      publicUrl = `${process.env.BUNNY_CDN_URL}/vehiculos/${uniqueFileName}`;
    }

    return NextResponse.json({ publicUrl });

  } catch (error) {
    console.error("Error en /api/upload:", error);
    return NextResponse.json({ error: "Error interno subiendo la imagen" }, { status: 500 });
  }
}