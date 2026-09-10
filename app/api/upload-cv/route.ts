import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { verificarTurnstile } from "@/lib/turnstile";
import { validarYObtenerMimeReal } from "@/lib/validarArchivo";
import { registrarError } from "@/lib/logger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

// El form de "Trabajá con nosotros" subía el CV directo desde el navegador a
// Supabase Storage con la clave anon, antes de que corriera cualquier
// verificación -- sin Turnstile, sin límite de tamaño, sin chequear que el
// archivo sea realmente un PDF. Server-side acá, mismo patrón que
// upload-cotizacion (Turnstile + rate limit + magic bytes reales).
export async function POST(request: Request) {
  try {
    const ip = ipDesdeRequest(request);
    const limite = await rateLimit(ip, { limite: 10, ventanaMs: 10 * 60 * 1000 });
    if (!limite.ok) {
      return NextResponse.json({ error: "Demasiados archivos subidos. Esperá un momento." }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const turnstileToken = formData.get("turnstileToken") as string;

    if (!turnstileToken || !(await verificarTurnstile(turnstileToken, ip))) {
      return NextResponse.json({ error: "No pudimos verificar que sos humano. Reintentá." }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "No se encontró ningún archivo." }, { status: 400 });
    }

    const MAX_BYTES = 10 * 1024 * 1024; // 10MB, de sobra para un CV en PDF
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "El archivo pesa demasiado (máximo 10MB)." }, { status: 400 });
    }

    const buffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));
    const mimeReal = validarYObtenerMimeReal(buffer, ["pdf"]);
    if (!mimeReal) {
      return NextResponse.json({ error: "El CV tiene que ser un PDF." }, { status: 400 });
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const filePath = `${Date.now()}-${Math.floor(Math.random() * 10000)}-${cleanFileName}`;

    const { error: uploadError } = await supabase.storage.from("cvs").upload(filePath, buffer, { contentType: mimeReal });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from("cvs").getPublicUrl(filePath);
    return NextResponse.json({ publicUrl: publicUrlData.publicUrl });
  } catch (error) {
    registrarError("api/upload-cv", error);
    return NextResponse.json({ error: "Error interno subiendo el CV." }, { status: 500 });
  }
}
