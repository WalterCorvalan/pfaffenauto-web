import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { subirArchivoR2 } from "@/lib/storage/r2";
import { validarYObtenerMimeReal } from "@/lib/validarArchivo";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/panelV2/logger";

const MAX_MB = 8;

// Distinta de /api/upload (fotos de autos, v1, con recorte de fondo) --
// esta es la foto de perfil de la persona: auth de panel-v2, sin
// remove.bg (le arruinaría la cara), prefijo propio en R2.
export async function POST(request: Request) {
  const limite = await rateLimit(ipDesdeRequest(request), { limite: 10, ventanaMs: 60 * 1000, proyecto: "v2" });
  if (!limite.ok) return NextResponse.json({ error: "Demasiadas subidas. Esperá un momento." }, { status: 429 });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE2_URL!,
    process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No se encontró ningún archivo." }, { status: 400 });
    if (file.size > MAX_MB * 1024 * 1024) return NextResponse.json({ error: `La imagen pesa demasiado (máximo ${MAX_MB}MB).` }, { status: 400 });

    const buffer = Buffer.from(new Uint8Array(await file.arrayBuffer()));
    const mime = validarYObtenerMimeReal(buffer, ["imagen"]);
    if (!mime) return NextResponse.json({ error: "Solo se permiten imágenes." }, { status: 400 });

    const publicUrl = await subirArchivoR2(buffer, `perfiles/${user.id}-${Date.now()}.${mime.split("/")[1] || "jpg"}`, mime);

    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE2_URL!, process.env.SUPABASE2_SERVICE_ROLE_KEY!);
    await admin.from("perfiles").update({ foto_url: publicUrl }).eq("id", user.id);

    return NextResponse.json({ publicUrl });
  } catch (error) {
    registrarError("api/panel/perfil/foto", error);
    return NextResponse.json({ error: "Error interno subiendo la imagen." }, { status: 500 });
  }
}
