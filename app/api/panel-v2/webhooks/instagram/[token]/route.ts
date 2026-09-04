import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { isAiConfiguredV2 } from "@/lib/ai/indexV2";
import { generarRespuestaAgenteV2, dividirRespuestaEnMensajes } from "@/lib/ai/agenteV2";
import { sendInstagramPrivateReply, sendInstagramMessage } from "@/lib/meta/client";
import { decrypt } from "@/lib/crypto";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";

// Webhook de Meta para el Instagram de panel-v2 (Conversaciones → Instagram),
// mismo patrón que /api/panel-v2/webhooks/whatsapp: comentario en un post →
// respuesta privada automática, y a partir de ahí sigue como DM normal
// atendido por el mismo agente (agenteV2). Credenciales cifradas en
// instagram_configuracion (Configuración → Instagram), no en env vars.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

const MENSAJE_APERTURA =
  "¡Hola! 👋 Gracias por tu comentario. Te escribimos por acá para ayudarte más rápido — ¿qué auto te interesa?";

async function tokenValido(token: string): Promise<boolean> {
  const { data } = await supabase.from("instagram_configuracion").select("webhook_verify_token").eq("id", true).single();
  const expected = data?.webhook_verify_token ?? "";
  if (!expected) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await tokenValido(token))) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const verifyToken = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const { data: config } = await supabase.from("instagram_configuracion").select("webhook_verify_token").eq("id", true).single();
  if (mode === "subscribe" && verifyToken === config?.webhook_verify_token) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const limite = rateLimit(ipDesdeRequest(req), { limite: 60, ventanaMs: 60 * 1000 });
  if (!limite.ok) return new Response("Too many requests", { status: 429 });

  const { token } = await params;
  if (!(await tokenValido(token))) return new Response("Not found", { status: 404 });

  const rawBody = await req.text();

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error("[webhook-ig-v2] META_APP_SECRET no está configurada.");
    return new Response("Unauthorized", { status: 401 });
  }

  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  try {
    await procesarEvento(payload);
  } catch (err) {
    console.error("[webhook-ig-v2] error procesando:", err);
  }

  return Response.json({ received: true });
}

async function procesarEvento(payload: any) {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field === "comments") {
        await procesarComentario(change.value);
      }
    }
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
    .select("id, vendedor_id, ai_habilitada")
    .eq("contacto_id", contacto.id)
    .maybeSingle();

  if (!conversacion) {
    // El trigger asignar_vendedor_conversacion_nueva_instagram le pone
    // vendedor solo (ronda) antes de que termine el insert.
    const { data: nueva } = await supabase
      .from("instagram_conversaciones")
      .insert({ contacto_id: contacto.id })
      .select("id, vendedor_id, ai_habilitada")
      .single();
    conversacion = nueva;
  }
  return conversacion
    ? { conversacionId: conversacion.id, contactoId: contacto.id, aiHabilitada: conversacion.ai_habilitada }
    : null;
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
  });
  await supabase.from("instagram_conversaciones").update({ last_inbound_at: new Date().toISOString() }).eq("id", refs.conversacionId);

  const { data: config } = await supabase.from("instagram_configuracion").select("*").eq("id", true).single();
  if (!isInstagramEnvioConfigurado(config)) {
    console.warn("[webhook-ig-v2] Instagram no está configurado: respuesta privada no enviada.");
    return;
  }

  try {
    const tokenPlano = decrypt(config.token_cifrado, config.token_iv, config.token_tag);
    await sendInstagramPrivateReply(commentId, tokenPlano, MENSAJE_APERTURA);
    await supabase.from("instagram_mensajes").insert({
      conversacion_id: refs.conversacionId,
      direccion: "out",
      tipo: "text",
      texto: MENSAJE_APERTURA,
      status: "sent",
      ai_generado: false,
    });
  } catch (err) {
    console.error("[webhook-ig-v2] error enviando respuesta privada:", err);
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
  if (error) {
    if (error.code === "23505") return; // duplicado, Meta reintentó el mismo evento
    console.error("[webhook-ig-v2] error insertando mensaje:", error);
    return;
  }

  await supabase.from("instagram_conversaciones").update({
    last_inbound_at: new Date().toISOString(),
    last_message_at: new Date().toISOString(),
  }).eq("id", refs.conversacionId);
  // Alerta de "nuevo mensaje" la dispara el trigger sobre instagram_mensajes.

  await ejecutarAgente(refs.conversacionId, igUserId);
}

const RESPUESTA_FALLBACK = "¡Hola! Gracias por escribirnos a Pfaffen Autos. En breve te contacta uno de nuestros asesores. 🚗";

function isInstagramEnvioConfigurado(config: any): boolean {
  return !!config?.listo && !!config?.token_cifrado && !!config?.token_iv && !!config?.token_tag && !!config?.ig_user_id;
}

function estaEnHorarioAtencion(): boolean {
  const hora = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return hora >= 8 && hora < 22;
}

async function ejecutarAgente(conversacionId: string, igUserId: string) {
  if (!isAiConfiguredV2()) return;
  if (!estaEnHorarioAtencion()) return;

  const { data: conversacionActual } = await supabase.from("instagram_conversaciones").select("ai_habilitada").eq("id", conversacionId).single();
  if (conversacionActual?.ai_habilitada === false) return;

  const { data: mensajes } = await supabase.from("instagram_mensajes").select("direccion, texto").eq("conversacion_id", conversacionId).order("created_at", { ascending: true }).limit(20);
  const historial = (mensajes ?? []).filter((m) => m.texto).map((m) => ({ role: (m.direccion === "in" ? "user" : "assistant") as "user" | "assistant", content: m.texto as string }));

  const result = await generarRespuestaAgenteV2(historial, "panel-v2/webhooks/instagram");
  const { data: config } = await supabase.from("instagram_configuracion").select("*").eq("id", true).single();

  if (!result.ok) {
    console.error("[webhook-ig-v2] error del agente:", result.error);
    const { data: mensajeFallback } = await supabase.from("instagram_mensajes").insert({ conversacion_id: conversacionId, direccion: "out", tipo: "text", texto: RESPUESTA_FALLBACK, status: "pending", ai_generado: false }).select("id").single();
    if (mensajeFallback) await enviarYActualizarMensaje(mensajeFallback.id, igUserId, RESPUESTA_FALLBACK, config);
    return;
  }

  const { reply, handoff, calificacion, resumen_handoff } = result.data;

  const estadoSegunCalificacion = calificacion === "caliente" ? "calificando" : undefined;
  const patchConversacion: Record<string, unknown> = { calificacion };
  if (estadoSegunCalificacion) patchConversacion.estado_lead = estadoSegunCalificacion;
  await supabase.from("instagram_conversaciones").update(patchConversacion).eq("id", conversacionId);

  for (const parte of dividirRespuestaEnMensajes(reply)) {
    const { data: mensajeSaliente } = await supabase.from("instagram_mensajes").insert({ conversacion_id: conversacionId, direccion: "out", tipo: "text", texto: parte, status: "pending", ai_generado: true }).select("id").single();
    if (mensajeSaliente) await enviarYActualizarMensaje(mensajeSaliente.id, igUserId, parte, config);
  }

  if (handoff) {
    await supabase.from("instagram_conversaciones").update({
      handoff_at: new Date().toISOString(), handoff_reason: "cliente_pidio_humano",
      handoff_resumen: resumen_handoff || null,
    }).eq("id", conversacionId);
    // La alerta de handoff la dispara el trigger sobre instagram_conversaciones.
  }
}

async function enviarYActualizarMensaje(mensajeId: string, igUserId: string, texto: string, config: any) {
  if (!isInstagramEnvioConfigurado(config)) {
    console.warn("[webhook-ig-v2] Instagram no está configurado — mensaje queda 'pending' sin enviar.");
    return;
  }

  try {
    const tokenPlano = decrypt(config.token_cifrado, config.token_iv, config.token_tag);
    await sendInstagramMessage(config.ig_user_id, tokenPlano, igUserId, texto);
    await supabase.from("instagram_mensajes").update({ status: "sent" }).eq("id", mensajeId);
  } catch (err) {
    console.error("[webhook-ig-v2] error enviando DM:", err);
    await supabase.from("instagram_mensajes").update({ status: "failed" }).eq("id", mensajeId);
  }
}
