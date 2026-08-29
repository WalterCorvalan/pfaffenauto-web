import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { sendInstagramMessage } from "@/lib/meta/client";
import { decrypt } from "@/lib/crypto";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { z } from "zod";

const EnviarSchema = z.object({
  conversacionId: z.string().uuid(),
  texto: z.string().trim().min(1).max(4000),
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const limite = rateLimit(ipDesdeRequest(request), { limite: 30, ventanaMs: 60 * 1000 });
  if (!limite.ok) {
    return NextResponse.json({ error: "Demasiados mensajes. Esperá un momento." }, { status: 429 });
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

  const parsed = EnviarSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Falta conversacionId o texto." }, { status: 400 });
  }
  const { conversacionId, texto } = parsed.data;

  const { data: conversacion } = await supabaseAdmin
    .from("instagram_conversaciones")
    .select("contacto_id, instagram_contactos(ig_user_id)")
    .eq("id", conversacionId)
    .single();

  const igUserId = (conversacion?.instagram_contactos as any)?.ig_user_id;
  if (!igUserId) {
    return NextResponse.json({ error: "No se encontró el contacto de Instagram." }, { status: 404 });
  }

  const { data: mensaje, error: insertError } = await supabaseAdmin
    .from("instagram_mensajes")
    .insert({ conversacion_id: conversacionId, direccion: "out", tipo: "text", texto, status: "pending", ai_generado: false })
    .select("id")
    .single();

  if (insertError || !mensaje) {
    return NextResponse.json({ error: "No se pudo guardar el mensaje." }, { status: 500 });
  }

  const { data: config } = await supabaseAdmin.from("instagram_configuracion").select("*").eq("id", true).single();
  if (!config?.listo || !config.token_cifrado || !config.token_iv || !config.token_tag || !config.ig_user_id) {
    await supabaseAdmin.from("instagram_mensajes").update({ status: "failed" }).eq("id", mensaje.id);
    return NextResponse.json({ error: "Instagram no está configurado — cargá las credenciales en Configuración." }, { status: 503 });
  }

  try {
    const token = decrypt(config.token_cifrado, config.token_iv, config.token_tag);
    await sendInstagramMessage(config.ig_user_id, token, igUserId, texto);
    await supabaseAdmin.from("instagram_mensajes").update({ status: "sent" }).eq("id", mensaje.id);
    await supabaseAdmin.from("instagram_conversaciones").update({ last_message_at: new Date().toISOString() }).eq("id", conversacionId);
  } catch (err: any) {
    await supabaseAdmin.from("instagram_mensajes").update({ status: "failed" }).eq("id", mensaje.id);
    return NextResponse.json({ error: err?.message ?? "Error enviando el mensaje." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, mensajeId: mensaje.id });
}
