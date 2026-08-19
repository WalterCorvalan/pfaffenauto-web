import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { sendInstagramMessage } from "@/lib/meta/client";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// El vendedor responde manualmente desde /panel/chat — mismo patrón que WhatsApp.
export async function POST(request: Request) {
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

  const { conversacionId, texto } = await request.json();
  if (!conversacionId || !texto?.trim()) {
    return NextResponse.json({ error: "Falta conversacionId o texto." }, { status: 400 });
  }

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
    .insert({
      conversacion_id: conversacionId,
      direccion: "out",
      tipo: "text",
      texto,
      status: "pending",
      ai_generado: false,
    })
    .select("id")
    .single();

  if (insertError || !mensaje) {
    return NextResponse.json({ error: "No se pudo guardar el mensaje." }, { status: 500 });
  }

  if (!process.env.META_INSTAGRAM_TOKEN || !process.env.META_INSTAGRAM_USER_ID) {
    await supabaseAdmin.from("instagram_mensajes").update({ status: "failed" }).eq("id", mensaje.id);
    return NextResponse.json({ error: "Instagram no está configurado (falta token/user_id)." }, { status: 503 });
  }

  try {
    await sendInstagramMessage(
      process.env.META_INSTAGRAM_USER_ID,
      process.env.META_INSTAGRAM_TOKEN,
      igUserId,
      texto
    );
    await supabaseAdmin.from("instagram_mensajes").update({ status: "sent" }).eq("id", mensaje.id);
    await supabaseAdmin
      .from("instagram_conversaciones")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversacionId);
  } catch (err: any) {
    await supabaseAdmin.from("instagram_mensajes").update({ status: "failed" }).eq("id", mensaje.id);
    return NextResponse.json({ error: err?.message ?? "Error enviando el mensaje." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, mensajeId: mensaje.id });
}
