import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { isAiConfiguredV2 } from "@/lib/ai/indexV2";
import { generarRespuestaAgenteV2, dividirRespuestaEnMensajes } from "@/lib/ai/agenteV2";
import { sendInstagramPrivateReply, sendInstagramMessage, replyToInstagramCommentPublicly } from "@/lib/meta/client";
import { decrypt } from "@/lib/crypto";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/panel/logger";

// Webhook de Meta para el Instagram de panel (Conversaciones → Instagram),
// mismo patrón que /api/panel/webhooks/whatsapp: comentario en un post →
// respuesta privada automática, y a partir de ahí sigue como DM normal
// atendido por el mismo agente (agenteV2). Credenciales cifradas en
// instagram_configuracion (Configuración → Instagram), no en env vars.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

const MENSAJE_APERTURA =
  "¡Hola! 👋 Gracias por tu comentario. Te escribimos por acá para ayudarte más rápido — ¿qué auto te interesa?";

// Automatización tipo ManyChat: si el texto del comentario contiene alguna
// palabra clave configurada en Configuración > Instagram, se usa esa
// respuesta puntual en vez del mensaje de apertura genérico -- reglas
// globales (no por post), la primera que matchea por orden gana.
async function buscarAutomatizacionPorComentario(texto: string): Promise<{ respuesta_dm: string; respuesta_publica: string | null } | null> {
  const { data: reglas } = await supabase
    .from("instagram_automatizaciones_comentarios")
    .select("palabras_clave, respuesta_dm, respuesta_publica")
    .eq("activo", true)
    .order("orden");
  const textoLower = texto.toLowerCase();
  for (const regla of reglas || []) {
    if ((regla.palabras_clave || []).some((p: string) => textoLower.includes(p.toLowerCase()))) {
      return { respuesta_dm: regla.respuesta_dm, respuesta_publica: regla.respuesta_publica || null };
    }
  }
  return null;
}

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
  const limite = await rateLimit(ipDesdeRequest(req), { limite: 60, ventanaMs: 60 * 1000, proyecto: "v2" });
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
    registrarError("webhook-ig-v2:procesar-evento", err);
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
    .select("id, vendedor_id, ai_habilitada, canal_origen")
    .eq("contacto_id", contacto.id)
    .maybeSingle();

  if (!conversacion) {
    // El trigger asignar_vendedor_conversacion_nueva_instagram le pone
    // vendedor solo (ronda) antes de que termine el insert.
    const { data: nueva } = await supabase
      .from("instagram_conversaciones")
      .insert({ contacto_id: contacto.id })
      .select("id, vendedor_id, ai_habilitada, canal_origen")
      .single();
    conversacion = nueva;
  }
  return conversacion
    ? { conversacionId: conversacion.id, contactoId: contacto.id, aiHabilitada: conversacion.ai_habilitada, canalOrigen: conversacion.canal_origen }
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

  const automatizacion = await buscarAutomatizacionPorComentario(texto);
  const mensajeDm = automatizacion?.respuesta_dm || MENSAJE_APERTURA;

  try {
    const tokenPlano = decrypt(config.token_cifrado, config.token_iv, config.token_tag);
    await sendInstagramPrivateReply(commentId, tokenPlano, mensajeDm);
    await supabase.from("instagram_mensajes").insert({
      conversacion_id: refs.conversacionId,
      direccion: "out",
      tipo: "text",
      texto: mensajeDm,
      status: "sent",
      ai_generado: false,
    });
    // Respuesta pública opcional debajo del comentario -- solo cuando la
    // regla que matcheó tiene una configurada (nunca en el caso genérico
    // sin match, mismo comportamiento de siempre ahí).
    if (automatizacion?.respuesta_publica) {
      try {
        await replyToInstagramCommentPublicly(commentId, tokenPlano, automatizacion.respuesta_publica);
      } catch (err) {
        registrarError("webhook-ig-v2:respuesta-publica", err, { conversacionId: refs.conversacionId, commentId });
      }
    }
  } catch (err) {
    registrarError("webhook-ig-v2:respuesta-privada", err, { conversacionId: refs.conversacionId, commentId });
  }
}

async function procesarMensajeDirecto(msg: any) {
  const igUserId = msg.sender?.id;
  const texto = msg.message?.text;
  const igMessageId = msg.message?.mid;
  if (!igUserId || !texto) return;

  const refs = await obtenerOCrearConversacion(igUserId, null);
  if (!refs) return;

  // Meta manda "referral" en el evento de mensaje cuando la charla arrancó
  // desde un anuncio de Click-to-Instagram o el botón "Enviar mensaje" de
  // un posteo/story -- mismo patrón que el webhook de WhatsApp (ver ese
  // archivo). Mismo vocabulario que lib/utm.ts para hablar el mismo idioma
  // que /panel/marketing/pautas.
  if (msg.referral && !refs.canalOrigen) {
    await supabase.from("instagram_conversaciones").update({ canal_origen: "Meta Ads" }).eq("id", refs.conversacionId);
  }

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
    registrarError("webhook-ig-v2:insertar-mensaje", error, { conversacionId: refs.conversacionId });
    return;
  }

  await supabase.from("instagram_conversaciones").update({
    last_inbound_at: new Date().toISOString(),
    last_message_at: new Date().toISOString(),
  }).eq("id", refs.conversacionId);
  // Alerta de "nuevo mensaje" la dispara el trigger sobre instagram_mensajes.

  await ejecutarAgente(refs.conversacionId, igUserId);
}

const RESPUESTA_FALLBACK = "¡Hola! Gracias por escribirnos a Pfaffen Cars. En breve te contacta uno de nuestros asesores. 🚗";

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

  const { data: conversacionActual } = await supabase.from("instagram_conversaciones").select("ai_habilitada, contacto_id").eq("id", conversacionId).single();
  if (conversacionActual?.ai_habilitada === false) return;

  const { data: mensajes } = await supabase.from("instagram_mensajes").select("direccion, texto").eq("conversacion_id", conversacionId).order("created_at", { ascending: true }).limit(20);
  const historial = (mensajes ?? []).filter((m) => m.texto).map((m) => ({ role: (m.direccion === "in" ? "user" : "assistant") as "user" | "assistant", content: m.texto as string }));

  const { data: config } = await supabase.from("instagram_configuracion").select("*").eq("id", true).single();
  // Instagram tiene que sonar igual de profesional y serio que WhatsApp --
  // un vendedor real, no un amigo chateando. El admin puede pisar esto
  // cargando su propio tono en Configuración > Instagram, pero no depende
  // de que lo haga (el campo hoy suele estar vacío).
  const tonoInstagram = config?.tono?.trim() || "profesional y serio, como un vendedor de la concesionaria atendiendo por Instagram -- el mismo tono formal y directo que se usa en WhatsApp, sin informalidades ni frases de amigo (nada de \"che\", \"dale\", tratar al cliente como si fueran conocidos). Amable y claro, pero siempre con la seriedad de alguien vendiendo un vehículo, no charlando en redes sociales.";
  const result = await generarRespuestaAgenteV2(historial, "panel/webhooks/instagram", undefined, undefined, tonoInstagram, true);

  if (!result.ok) {
    registrarError("webhook-ig-v2:agente", result.error, { conversacionId });
    const { data: mensajeFallback } = await supabase.from("instagram_mensajes").insert({ conversacion_id: conversacionId, direccion: "out", tipo: "text", texto: RESPUESTA_FALLBACK, status: "pending", ai_generado: false }).select("id").single();
    if (mensajeFallback) await enviarYActualizarMensaje(mensajeFallback.id, igUserId, RESPUESTA_FALLBACK, config);
    return;
  }

  const { reply, handoff, calificacion, resumen_handoff, datos_detectados } = result.data;

  const estadoSegunCalificacion = calificacion === "caliente" ? "calificando" : undefined;
  const patchConversacion: Record<string, unknown> = { calificacion };
  if (estadoSegunCalificacion) patchConversacion.estado_lead = estadoSegunCalificacion;
  await supabase.from("instagram_conversaciones").update(patchConversacion).eq("id", conversacionId);

  // El agente SÍ le pregunta el nombre real al cliente en Instagram (regla
  // DATOS DE CONTACTO), pero hasta ahora nunca se guardaba en ningún lado --
  // instagram_contactos solo tenía username (el @ de Instagram, no el
  // nombre real). Mismo patrón que whatsapp_contactos.nombre_perfil.
  if (datos_detectados?.nombre && conversacionActual?.contacto_id) {
    await supabase.from("instagram_contactos").update({ nombre_perfil: datos_detectados.nombre }).eq("id", conversacionActual.contacto_id);
  }

  for (const parte of dividirRespuestaEnMensajes(reply)) {
    const { data: mensajeSaliente } = await supabase.from("instagram_mensajes").insert({ conversacion_id: conversacionId, direccion: "out", tipo: "text", texto: parte, status: "pending", ai_generado: true }).select("id").single();
    if (mensajeSaliente) await enviarYActualizarMensaje(mensajeSaliente.id, igUserId, parte, config);
  }

  if (handoff) {
    await supabase.from("instagram_conversaciones").update({
      handoff_at: new Date().toISOString(), handoff_reason: "cliente_pidio_humano",
      handoff_resumen: resumen_handoff || null,
      // Mismo comportamiento que WhatsApp (webhooks/whatsapp/[token]/route.ts):
      // al derivar, la IA se pausa acá mismo -- sin esto el bot seguía
      // contestando en Instagram después del handoff, mientras el panel
      // mostraba el badge de "IA en pausa" como si ya hubiera dejado de
      // responder (inconsistente con lo que pasaba de verdad).
      ai_habilitada: false,
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
    registrarError("webhook-ig-v2:enviar-dm", err, { mensajeId, igUserId });
    await supabase.from("instagram_mensajes").update({ status: "failed" }).eq("id", mensajeId);
  }
}
