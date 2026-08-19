import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { generarRespuestaAgente } from "@/lib/ai/agente";
import { sendInstagramPrivateReply, sendInstagramMessage } from "@/lib/meta/client";
import { notificarPersona, notificarEncargados } from "@/lib/notificaciones";

// Comentario en un post → respuesta privada automática (estilo ManyChat), y a
// partir de ahí la conversación sigue como un DM normal, atendido por el mismo
// agente de IA que ya usamos en WhatsApp (grounded en stock real).

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MENSAJE_APERTURA =
  "¡Hola! 👋 Gracias por tu comentario. Te escribimos por acá para ayudarte más rápido — ¿qué auto te interesa?";

function tokenValido(token: string): boolean {
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN ?? "";
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!tokenValido(token)) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const verifyToken = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && verifyToken === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!tokenValido(token)) return new Response("Not found", { status: 404 });

  const rawBody = await req.text();

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error("[ig-webhook] Error: META_APP_SECRET no configurado.");
    return new Response("Unauthorized", { status: 401 });
  }

  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  procesarEvento(payload).catch((err) => console.error("[ig-webhook] error procesando:", err));

  return Response.json({ received: true });
}

async function procesarEvento(payload: any) {
  for (const entry of payload.entry ?? []) {
    // Comentarios en posts/reels
    for (const change of entry.changes ?? []) {
      if (change.field === "comments") {
        await procesarComentario(change.value);
      }
    }
    // Mensajes directos (DM real, después del primer contacto)
    for (const msg of entry.messaging ?? []) {
      if (msg.message?.text) {
        await procesarMensajeDirecto(msg);
      }
    }
  }
}

async function obtenerOCrearConversacion(igUserId: string, username: string | null) {
  const { data: contacto } = await supabase
    .from("instagram_contactos")
    .upsert({ ig_user_id: igUserId, username }, { onConflict: "ig_user_id", ignoreDuplicates: false })
    .select("id")
    .single();
  if (!contacto) return null;

  let { data: conversacion } = await supabase
    .from("instagram_conversaciones")
    .select("id, vendedor_id")
    .eq("contacto_id", contacto.id)
    .maybeSingle();

  if (!conversacion) {
    const { data: nueva } = await supabase
      .from("instagram_conversaciones")
      .insert({ contacto_id: contacto.id })
      .select("id, vendedor_id")
      .single();
    conversacion = nueva;
  }
  return conversacion ? { conversacionId: conversacion.id, contactoId: contacto.id, vendedorId: conversacion.vendedor_id as string | null } : null;
}

async function procesarComentario(value: any) {
  const commentId = value?.id;
  const igUserId = value?.from?.id;
  const username = value?.from?.username ?? null;
  const texto = value?.text ?? "";
  if (!commentId || !igUserId) return;

  const refs = await obtenerOCrearConversacion(igUserId, username);
  if (!refs) return;

  await supabase.from("instagram_mensajes").insert({
    conversacion_id: refs.conversacionId,
    direccion: "in",
    tipo: "text",
    texto,
    status: "received",
    es_comentario: true,
    ig_comment_id: commentId,
  });

  await supabase.from("instagram_conversaciones").update({ last_inbound_at: new Date().toISOString() }).eq("id", refs.conversacionId);

  if (!isInstagramEnvioConfigurado()) {
    console.warn("[ig-webhook] META_INSTAGRAM_TOKEN no configurado: respuesta privada no enviada.");
    return;
  }

  try {
    await sendInstagramPrivateReply(commentId, process.env.META_INSTAGRAM_TOKEN!, MENSAJE_APERTURA);
    await supabase.from("instagram_mensajes").insert({
      conversacion_id: refs.conversacionId,
      direccion: "out",
      tipo: "text",
      texto: MENSAJE_APERTURA,
      status: "sent",
      ai_generado: false,
    });
  } catch (err) {
    console.error("[ig-webhook] error enviando respuesta privada:", err);
  }
}

async function procesarMensajeDirecto(msg: any) {
  const igUserId = msg.sender?.id;
  const texto = msg.message?.text;
  const igMessageId = msg.message?.mid;
  if (!igUserId || !texto) return;

  const refs = await obtenerOCrearConversacion(igUserId, null);
  if (!refs) return;

  const { error } = await supabase.from("instagram_mensajes").insert({
    conversacion_id: refs.conversacionId,
    ig_message_id: igMessageId,
    direccion: "in",
    tipo: "text",
    texto,
    status: "received",
  });
  if (error && error.code !== "23505") {
    console.error("[ig-webhook] error insertando mensaje:", error);
    return;
  }
  if (error?.code === "23505") return; // duplicado, Meta reintentó el mismo evento

  await supabase.from("instagram_conversaciones").update({
    last_inbound_at: new Date().toISOString(),
    last_message_at: new Date().toISOString(),
  }).eq("id", refs.conversacionId);

  const mensajeNoti = `Instagram: ${texto}`;
  const linkNoti = `/panel/chat?conversacion=${refs.conversacionId}&canal=instagram`;
  if (refs.vendedorId) {
    notificarPersona(supabase, refs.vendedorId, "nuevo_mensaje_chat", mensajeNoti, linkNoti, "chat").catch((err) => console.error("[ig] error notificando:", err));
  } else {
    notificarEncargados(supabase, mensajeNoti, linkNoti, "chat", "nuevo_mensaje_chat").catch((err) => console.error("[ig] error notificando:", err));
  }

  await ejecutarAgente(refs.conversacionId, igUserId);
}

async function ejecutarAgente(conversacionId: string, igUserId: string) {
  const { data: conversacionActual } = await supabase
    .from("instagram_conversaciones")
    .select("ai_habilitada")
    .eq("id", conversacionId)
    .single();
  if (conversacionActual?.ai_habilitada === false) return; // ya tomó un humano, no interferir

  const { data: mensajes } = await supabase
    .from("instagram_mensajes")
    .select("direccion, texto")
    .eq("conversacion_id", conversacionId)
    .order("created_at", { ascending: true })
    .limit(20);

  const historial = (mensajes ?? [])
    .filter((m) => m.texto)
    .map((m) => ({ role: (m.direccion === "in" ? "user" : "assistant") as "user" | "assistant", content: m.texto as string }));

  const result = await generarRespuestaAgente(historial);
  if (!result.ok) {
    console.error("[ig-agente] error:", result.error);
    return;
  }

  const { reply, calificacion, handoff } = result.data;
  const estadoSegunCalificacion =
    calificacion === "caliente" ? "Interesado" : calificacion === "frio" ? "Perdido" : "Contactado";

  await supabase.from("instagram_conversaciones").update({ calificacion, estado: estadoSegunCalificacion }).eq("id", conversacionId);

  if (handoff) {
    const { data: convHandoff } = await supabase
      .from("instagram_conversaciones")
      .update({ handoff_at: new Date().toISOString(), handoff_reason: "cliente_pidio_humano", ai_habilitada: false })
      .eq("id", conversacionId)
      .select("vendedor_id")
      .single();
    const linkNoti = `/panel/chat?conversacion=${conversacionId}&canal=instagram`;
    const mensajeNoti = "El cliente pidió hablar con una persona — la IA dejó de responder.";
    if (convHandoff?.vendedor_id) {
      notificarPersona(supabase, convHandoff.vendedor_id, "handoff_chat", mensajeNoti, linkNoti, "chat").catch((err) => console.error("[ig] error notificando handoff:", err));
    } else {
      notificarEncargados(supabase, mensajeNoti, linkNoti, "chat", "handoff_chat").catch((err) => console.error("[ig] error notificando handoff:", err));
    }
  }

  const { data: mensajeSaliente } = await supabase
    .from("instagram_mensajes")
    .insert({ conversacion_id: conversacionId, direccion: "out", tipo: "text", texto: reply, status: "pending", ai_generado: true })
    .select("id")
    .single();

  if (mensajeSaliente && isInstagramEnvioConfigurado()) {
    try {
      await sendInstagramMessage(process.env.META_INSTAGRAM_USER_ID!, process.env.META_INSTAGRAM_TOKEN!, igUserId, reply);
      await supabase.from("instagram_mensajes").update({ status: "sent" }).eq("id", mensajeSaliente.id);
    } catch (err) {
      console.error("[ig-agente] error enviando DM:", err);
      await supabase.from("instagram_mensajes").update({ status: "failed" }).eq("id", mensajeSaliente.id);
    }
  }
}

function isInstagramEnvioConfigurado(): boolean {
  return !!process.env.META_INSTAGRAM_TOKEN && !!process.env.META_INSTAGRAM_USER_ID;
}
