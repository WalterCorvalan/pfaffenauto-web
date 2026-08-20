import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { subirArchivoR2 } from "@/lib/storage/r2";

const MAX_MB = 5;

// Foto de perfil del staff — sin recorte de fondo (no son fotos de autos).
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No se encontró ningún archivo." }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Solo se permiten imágenes." }, { status: 400 });
    if (file.size > MAX_MB * 1024 * 1024) return NextResponse.json({ error: `La imagen pesa demasiado (máximo ${MAX_MB}MB).` }, { status: 400 });

    const buffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const uniqueFileName = `${user.id}-${Date.now()}-${cleanFileName}`;

    const publicUrl = await subirArchivoR2(buffer, `avatares/${uniqueFileName}`, file.type);

    return NextResponse.json({ publicUrl });
  } catch (error) {
    console.error("Error en /api/upload-avatar:", error);
    return NextResponse.json({ error: "Error interno subiendo la imagen" }, { status: 500 });
  }
}
