import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { sendTextMessage } from "@/lib/meta/client";
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

// El vendedor responde manualmente desde /panel-v2/whatsapp — a diferencia
// del bot, esto requiere sesión de staff logueada. Las credenciales de Meta
// viven cifradas en whatsapp_configuracion (Configuración → WhatsApp), no en
// variables de entorno como en v1.
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
    .from("whatsapp_conversaciones")
    .select("contacto_id, ai_habilitada, whatsapp_contactos(telefono)")
    .eq("id", conversacionId)
    .single();

  const telefono = (conversacion?.whatsapp_contactos as any)?.telefono;
  if (!telefono) {
    return NextResponse.json({ error: "No se encontró el teléfono del contacto." }, { status: 404 });
  }

  let textoFinal = texto;
  if (conversacion?.ai_habilitada === false) {
    const { data: perfil } = await supabaseAdmin.from("perfiles").select("nombre").eq("id", user.id).maybeSingle();
    if (perfil?.nombre) textoFinal = `[${perfil.nombre}]\n${texto}`;
  }

  const { data: mensaje, error: insertError } = await supabaseAdmin
    .from("whatsapp_mensajes")
    .insert({ conversacion_id: conversacionId, direccion: "out", tipo: "text", texto: textoFinal, status: "pending", ai_generado: false })
    .select("id")
    .single();

  if (insertError || !mensaje) {
    return NextResponse.json({ error: "No se pudo guardar el mensaje." }, { status: 500 });
  }

  const { data: config } = await supabaseAdmin.from("whatsapp_configuracion").select("*").eq("id", true).single();
  if (!config?.listo || !config.token_cifrado || !config.token_iv || !config.token_tag || !config.phone_number_id) {
    await supabaseAdmin.from("whatsapp_mensajes").update({ status: "failed" }).eq("id", mensaje.id);
    return NextResponse.json({ error: "WhatsApp no está configurado — cargá las credenciales en Configuración." }, { status: 503 });
  }

  try {
    const token = decrypt(config.token_cifrado, config.token_iv, config.token_tag);
    const resultado = await sendTextMessage(config.phone_number_id, token, telefono, textoFinal);
    await supabaseAdmin.from("whatsapp_mensajes").update({ status: "sent", wa_message_id: resultado.messages?.[0]?.id }).eq("id", mensaje.id);
    await supabaseAdmin.from("whatsapp_conversaciones").update({ last_message_at: new Date().toISOString() }).eq("id", conversacionId);
  } catch (err: any) {
    await supabaseAdmin.from("whatsapp_mensajes").update({ status: "failed" }).eq("id", mensaje.id);
    return NextResponse.json({ error: err?.message ?? "Error enviando el mensaje." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, mensajeId: mensaje.id });
}
