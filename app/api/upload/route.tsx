import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isRemoveBgConfigurado, quitarFondo } from "@/lib/removeBg";
import { subirArchivoR2 } from "@/lib/storage/r2";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";

const MAX_MB = 15;

export async function POST(request: Request) {
  try {
    const limite = rateLimit(ipDesdeRequest(request), { limite: 20, ventanaMs: 60 * 1000 });
    if (!limite.ok) {
      return NextResponse.json({ error: "Demasiadas subidas. Esperá un momento." }, { status: 429 });
    }

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
    
    const publicUrl = await subirArchivoR2(buffer, `vehiculos/${uniqueFileName}`, file.type);

    return NextResponse.json({ publicUrl });

  } catch (error) {
    registrarError("api/upload", error);
    return NextResponse.json({ error: "Error interno subiendo la imagen" }, { status: 500 });
  }
}