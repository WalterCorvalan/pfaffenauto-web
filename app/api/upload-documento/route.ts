import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { subirArchivoR2 } from "@/lib/storage/r2";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";
import { validarYObtenerMimeReal } from "@/lib/validarArchivo";

// Adjuntos de documentación de venta (título, formularios, cédulas, etc.) — solo staff logueado.
export async function POST(request: Request) {
  try {
    const limite = await rateLimit(ipDesdeRequest(request), { limite: 15, ventanaMs: 60 * 1000 });
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
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

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
    const mimeReal = validarYObtenerMimeReal(buffer, ["imagen", "pdf"]);
    if (!mimeReal) {
      return NextResponse.json({ error: "Solo se permiten fotos o PDF." }, { status: 400 });
    }
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const uniqueFileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}-${cleanFileName}`;

    const publicUrl = await subirArchivoR2(buffer, `documentacion/${uniqueFileName}`, mimeReal);

    return NextResponse.json({ publicUrl });
  } catch (error) {
    registrarError("api/upload-documento", error);
    return NextResponse.json({ error: "Error interno subiendo el archivo" }, { status: 500 });
  }
}
