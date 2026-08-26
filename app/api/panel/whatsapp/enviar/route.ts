import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { sendTextMessage } from "@/lib/meta/client";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { z } from "zod";

const EnviarWhatsappSchema = z.object({
  conversacionId: z.string().uuid(),
  texto: z.string().trim().min(1).max(4000),
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// El vendedor responde manualmente desde /panel/chat — a diferencia del bot,
// esto sí requiere sesión de staff logueada.
export async function POST(request: Request) {
  const limite = rateLimit(ipDesdeRequest(request), { limite: 30, ventanaMs: 60 * 1000 });
  if (!limite.ok) {
    return NextResponse.json({ error: "Demasiados mensajes. Esperá un momento." }, { status: 429 });
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

  const parsed = EnviarWhatsappSchema.safeParse(await request.json());
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

  // Con la IA pausada, un humano está respondiendo — le agregamos su nombre
  // adelante para que quede claro quién habla (igual que hacen las cuentas de
  // empresa de WhatsApp con varios agentes). Con la IA activa no hace falta.
  let textoFinal = texto;
  if (conversacion?.ai_habilitada === false) {
    const { data: perfil } = await supabaseAdmin.from("perfiles").select("nombre").eq("id", user.id).maybeSingle();
    if (perfil?.nombre) textoFinal = `[${perfil.nombre}]\n${texto}`;
  }

  const { data: mensaje, error: insertError } = await supabaseAdmin
    .from("whatsapp_mensajes")
    .insert({
      conversacion_id: conversacionId,
      direccion: "out",
      tipo: "text",
      texto: textoFinal,
      status: "pending",
      ai_generado: false,
    })
    .select("id")
    .single();

  if (insertError || !mensaje) {
    return NextResponse.json({ error: "No se pudo guardar el mensaje." }, { status: 500 });
  }

  if (!process.env.META_WHATSAPP_TOKEN || !process.env.META_WHATSAPP_PHONE_NUMBER_ID) {
    await supabaseAdmin.from("whatsapp_mensajes").update({ status: "failed" }).eq("id", mensaje.id);
    return NextResponse.json({ error: "WhatsApp no está configurado (falta token/phone_number_id)." }, { status: 503 });
  }

  try {
    const resultado = await sendTextMessage(
      process.env.META_WHATSAPP_PHONE_NUMBER_ID,
      process.env.META_WHATSAPP_TOKEN,
      telefono,
      textoFinal
    );
    await supabaseAdmin
      .from("whatsapp_mensajes")
      .update({ status: "sent", wa_message_id: resultado.messages?.[0]?.id })
      .eq("id", mensaje.id);
    await supabaseAdmin
      .from("whatsapp_conversaciones")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversacionId);
  } catch (err: any) {
    await supabaseAdmin.from("whatsapp_mensajes").update({ status: "failed" }).eq("id", mensaje.id);
    return NextResponse.json({ error: err?.message ?? "Error enviando el mensaje." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, mensajeId: mensaje.id });
}
