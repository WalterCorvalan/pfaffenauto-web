import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { subirArchivoR2 } from "@/lib/storage/r2";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";

const MAX_MB = 15;

// Subida genérica de panel-v2 (auth contra el proyecto Supabase nuevo) — a
// diferencia de /api/upload (v1, solo imágenes de autos), acepta también PDF
// para adjuntos de reclamos/expedientes.
export async function POST(request: Request) {
  try {
    const limite = rateLimit(ipDesdeRequest(request), { limite: 20, ventanaMs: 60 * 1000 });
    if (!limite.ok) {
      return NextResponse.json({ error: "Demasiadas subidas. Esperá un momento." }, { status: 429 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE2_URL!,
      process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const carpeta = (formData.get("carpeta") as string) || "panel-v2";

    if (!file) {
      return NextResponse.json({ error: "No se encontró ningún archivo." }, { status: 400 });
    }
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      return NextResponse.json({ error: "Solo se permiten imágenes o PDF." }, { status: 400 });
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return NextResponse.json({ error: `El archivo pesa demasiado (máximo ${MAX_MB}MB).` }, { status: 400 });
    }

    const buffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const uniqueFileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}-${cleanFileName}`;

    const publicUrl = await subirArchivoR2(buffer, `${carpeta}/${uniqueFileName}`, file.type);

    return NextResponse.json({ publicUrl, nombre: file.name });
  } catch (error) {
    registrarError("api/panel-v2/upload", error);
    return NextResponse.json({ error: "Error interno subiendo el archivo" }, { status: 500 });
  }
}
