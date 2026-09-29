import { createHmac, timingSafeEqual, randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { isAiConfiguredV2 } from "@/lib/ai/indexV2";
import { generarRespuestaAgenteV2, dividirRespuestaEnMensajes } from "@/lib/ai/agenteV2";
import { sendMessengerMessage, sendMessengerImageMessage, getMessengerUserProfile } from "@/lib/meta/client";
import { decrypt } from "@/lib/crypto";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/panel/logger";
import { subirArchivoR2, r2Configurado } from "@/lib/storage/r2";

// Webhook de Meta para el Facebook Messenger de la página -- mismo patrón
// exacto que /api/panel/webhooks/instagram (Messenger y el Instagram DM
// corren sobre la misma infraestructura de "Send/Receive API" de Meta, el
// payload que llega por entry[].messaging[] es prácticamente idéntico).
// Diferencias reales con Instagram: usa graph.facebook.com (no
// graph.instagram.com), el identificador de la otra persona es un PSID
// (Page-Scoped ID) en vez de un IGSID, no tiene username público (solo
// nombre real si Meta lo resuelve), y no hay flujo de "comentario ->
// respuesta privada" (Messenger arranca siempre con un mensaje directo).
// Credenciales cifradas en messenger_configuracion (Configuración >
// Messenger), no en env vars -- mismo criterio que WhatsApp/Instagram.
//
// TODAVÍA NO PROBADO CONTRA META REAL -- construido en paralelo mientras la
// verificación de negocio está pendiente (28/9), para que quede listo el día
// que se apruebe. Revisar el primer webhook real que llegue con cuidado.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

export const maxDuration = 30;

async function tokenValido(token: string): Promise<boolean> {
  const { data } = await supabase.from("messenger_configuracion").select("verify_token").eq("id", true).maybeSingle();
  const expected = data?.verify_token ?? "";
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

  const { data: config } = await supabase.from("messenger_configuracion").select("verify_token").eq("id", true).maybeSingle();
  if (mode === "subscribe" && verifyToken === config?.verify_token) {
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
    console.error("[webhook-messenger] META_APP_SECRET no está configurada.");
    return new Response("Unauthorized", { status: 401 });
  }

  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    registrarError("webhook-messenger:parse-body", err);
    return Response.json({ received: true });
  }
  try {
    await procesarEvento(payload);
  } catch (err) {
    registrarError("webhook-messenger:procesar-evento", err);
  }

  return Response.json({ received: true });
}

// Mismo fix de "mensajes seguidos" que WhatsApp/Instagram -- se guardan
// todos los mensajes entrantes del payload primero, el agente se dispara
// una sola vez por conversación tocada al final.
async function procesarEvento(payload: any) {
  const conversacionesTocadas = new Map<string, { mensajeId: string; psid: string }>();
  for (const entry of payload.entry ?? []) {
    for (const msg of entry.messaging ?? []) {
      // Echo de cualquier mensaje saliente de la página -- del bot (ya
      // guardado, tiene messenger_message_id) o de un empleado contestando a
      // mano desde el Administrador de Comentarios/Meta Business Suite.
      if (msg.message?.is_echo) {
        await procesarEcho(msg);
        continue;
      }
      // Recibo de lectura -- Messenger manda esto por "messaging_seen".
      if (msg.read) {
        await procesarLectura(msg);
        continue;
      }
      if (msg.message?.text || msg.message?.attachments?.length) {
        const resultado = await procesarMensajeDirecto(msg);
        if (resultado) conversacionesTocadas.set(resultado.conversacionId, { mensajeId: resultado.mensajeId, psid: resultado.psid });
      }
    }
  }
  for (const [conversacionId, { mensajeId, psid }] of conversacionesTocadas) {
    await ejecutarAgenteConDebounce(conversacionId, mensajeId, psid);
  }
}

const DEBOUNCE_MS = 6000;

async function ejecutarAgenteConDebounce(conversacionId: string, mensajeId: string, psid: string) {
  await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS));
  const { data: ultimoEntrante } = await supabase
    .from("messenger_mensajes")
    .select("id")
    .eq("conversacion_id", conversacionId)
    .eq("direccion", "in")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (ultimoEntrante && ultimoEntrante.id !== mensajeId) return;
  await ejecutarAgente(conversacionId, psid);
}

async function obtenerOCrearConversacion(psid: string, nombrePerfil: string | null) {
  const { data: contactoExistente } = await supabase.from("messenger_contactos").select("id, nombre_perfil").eq("psid", psid).maybeSingle();
  const nombreFinal = nombrePerfil ?? contactoExistente?.nombre_perfil ?? null;

  const { data: contacto } = await supabase
    .from("messenger_contactos")
    .upsert({ psid, nombre_perfil: nombreFinal }, { onConflict: "psid", ignoreDuplicates: false })
    .select("id")
    .single();
  if (!contacto) return null;

  let { data: conversacion } = await supabase
    .from("messenger_conversaciones")
    .select("id, vendedor_id, ai_habilitada, canal_origen, vehiculo_id")
    .eq("contacto_id", contacto.id)
    .maybeSingle();

  if (!conversacion) {
    const { data: nueva } = await supabase
      .from("messenger_conversaciones")
      .insert({ contacto_id: contacto.id, canal_origen: "Messenger" })
      .select("id, vendedor_id, ai_habilitada, canal_origen, vehiculo_id")
      .single();
    conversacion = nueva;
  }
  return conversacion
    ? { conversacionId: conversacion.id, contactoId: contacto.id, aiHabilitada: conversacion.ai_habilitada, canalOrigen: conversacion.canal_origen, vehiculoId: conversacion.vehiculo_id }
    : null;
}

// Igual que resolverTextoYMediaInstagram: un mensaje sin texto (foto/audio/
// video) no se puede seguir perdiendo -- se guarda un placeholder legible.
function resolverTextoYMediaMessenger(message: any): { texto: string | null; tipo: string; mediaUrl: string | null } {
  if (message?.text) return { texto: message.text, tipo: "text", mediaUrl: null };
  const attachment = message?.attachments?.[0];
  if (!attachment) return { texto: null, tipo: "text", mediaUrl: null };
  const url: string | null = attachment.payload?.url ?? null;
  if (attachment.type === "image") return { texto: url ? null : "[Envió una foto]", tipo: "image", mediaUrl: url };
  if (attachment.type === "audio") return { texto: "🎤 Audio", tipo: "audio", mediaUrl: url };
  if (attachment.type === "video") return { texto: url ? null : "[Envió un video]", tipo: "video", mediaUrl: url };
  return { texto: "[Envió un archivo]", tipo: "text", mediaUrl: null };
}

// Mismo criterio que Instagram (descargarYSubirMediaInstagram): la URL que
// manda Meta es de ellos, no nuestra -- se baja y sube a R2 para tener copia
// propia permanente. Best-effort: si falla, se guarda con la URL de Meta.
async function descargarYSubirMediaMessenger(url: string, tipo: string, messageId: string | undefined): Promise<string> {
  if (!r2Configurado()) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const buffer = Buffer.from(await res.arrayBuffer());
    const mimeType = res.headers.get("content-type") || (tipo === "image" ? "image/jpeg" : tipo === "audio" ? "audio/mpeg" : "video/mp4");
    const extension = mimeType.split("/")[1]?.split(";")[0] || (tipo === "image" ? "jpg" : tipo === "audio" ? "mp3" : "mp4");
    return await subirArchivoR2(buffer, `messenger/${tipo}/${Date.now()}-${messageId || randomUUID()}.${extension}`, mimeType.split(";")[0]);
  } catch {
    return url;
  }
}

async function procesarMensajeDirecto(msg: any): Promise<{ conversacionId: string; mensajeId: string; psid: string } | null> {
  const psid = msg.sender?.id;
  let { texto, tipo, mediaUrl } = resolverTextoYMediaMessenger(msg.message);
  const messengerMessageId = msg.message?.mid;
  if (!psid || (!texto && !mediaUrl)) return null;

  if (mediaUrl && (tipo === "image" || tipo === "audio" || tipo === "video")) {
    mediaUrl = await descargarYSubirMediaMessenger(mediaUrl, tipo, messengerMessageId);
  }

  // A diferencia de Instagram (no manda username en el evento de mensaje
  // tampoco), acá se resuelve el nombre real solo si todavía no lo tenemos
  // guardado -- evita pegarle a la API de Meta en cada mensaje.
  const { data: contactoPrevio } = await supabase.from("messenger_contactos").select("nombre_perfil").eq("psid", psid).maybeSingle();
  let nombreResuelto: string | null = contactoPrevio?.nombre_perfil ?? null;
  if (!nombreResuelto) {
    const { data: config } = await supabase.from("messenger_configuracion").select("token_cifrado, token_iv, token_tag").eq("id", true).maybeSingle();
    if (config?.token_cifrado && config.token_iv && config.token_tag) {
      try {
        const tokenPlano = decrypt(config.token_cifrado, config.token_iv, config.token_tag);
        const perfil = await getMessengerUserProfile(tokenPlano, psid);
        const nombreCompleto = [perfil.first_name, perfil.last_name].filter(Boolean).join(" ");
        nombreResuelto = nombreCompleto || null;
      } catch (err) {
        registrarError("webhook-messenger:resolver-nombre", err, { psid });
      }
    }
  }

  const refs = await obtenerOCrearConversacion(psid, nombreResuelto);
  if (!refs) return null;

  if (msg.referral && !refs.canalOrigen) {
    await supabase.from("messenger_conversaciones").update({ canal_origen: "Meta Ads" }).eq("id", refs.conversacionId);
  }

  const { data: mensajeInsertado, error } = await supabase.from("messenger_mensajes").insert({
    conversacion_id: refs.conversacionId,
    messenger_message_id: messengerMessageId,
    direccion: "in",
    tipo,
    texto,
    media_url: mediaUrl,
    status: "received",
  }).select("id").single();
  if (error) {
    if (error.code === "23505") return null; // duplicado, Meta reintentó el mismo evento
    registrarError("webhook-messenger:insertar-mensaje", error, { conversacionId: refs.conversacionId });
    return null;
  }

  await supabase.from("messenger_conversaciones").update({
    last_inbound_at: new Date().toISOString(),
    last_message_at: new Date().toISOString(),
  }).eq("id", refs.conversacionId);
  // Alerta de "nuevo mensaje" la dispara el trigger sobre messenger_mensajes.

  return { conversacionId: refs.conversacionId, mensajeId: mensajeInsertado.id, psid };
}

const RESPUESTA_FALLBACK = "¡Hola! Gracias por escribirnos a Pfaffen Cars. En breve te contacta uno de nuestros asesores. 🚗";

function isMessengerEnvioConfigurado(config: any): boolean {
  return !!config?.listo && !!config?.token_cifrado && !!config?.token_iv && !!config?.token_tag && !!config?.page_id;
}

function estaEnHorarioAtencion(): boolean {
  const hora = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return hora >= 8 && hora < 22;
}

async function ejecutarAgente(conversacionId: string, psid: string) {
  if (!isAiConfiguredV2()) return;
  if (!estaEnHorarioAtencion()) return;

  const { data: conversacionActual } = await supabase.from("messenger_conversaciones").select("ai_habilitada, contacto_id, vehiculo_id, vendedor_id").eq("id", conversacionId).single();
  if (conversacionActual?.ai_habilitada === false) return;

  const { data: mensajes } = await supabase.from("messenger_mensajes").select("direccion, texto").eq("conversacion_id", conversacionId).order("created_at", { ascending: true }).limit(20);
  const historial = (mensajes ?? []).filter((m) => m.texto).map((m) => ({ role: (m.direccion === "in" ? "user" : "assistant") as "user" | "assistant", content: m.texto as string }));

  const { data: config } = await supabase.from("messenger_configuracion").select("*").eq("id", true).maybeSingle();
  const tonoMessenger = config?.tono?.trim() || "profesional y serio, como un vendedor de la concesionaria atendiendo por Messenger -- el mismo tono formal y directo que se usa en WhatsApp, sin informalidades ni frases de amigo. Amable y claro, pero siempre con la seriedad de alguien vendiendo un vehículo.";
  // "panel-v2/webhooks/messenger" -- mismo criterio de prefijo que Instagram
  // (uso_ia_anthropic.origen), para que Marketing pueda filtrar el costo de
  // IA de este canal por separado el día que se prenda.
  const result = await generarRespuestaAgenteV2(historial, "panel-v2/webhooks/messenger", undefined, conversacionActual?.vehiculo_id ?? null, tonoMessenger, true);

  if (!result.ok) {
    registrarError("webhook-messenger:agente", result.error, { conversacionId });
    const { data: mensajeFallback } = await supabase.from("messenger_mensajes").insert({ conversacion_id: conversacionId, direccion: "out", tipo: "text", texto: RESPUESTA_FALLBACK, status: "pending", ai_generado: false }).select("id").single();
    if (mensajeFallback) await enviarYActualizarMensaje(mensajeFallback.id, psid, RESPUESTA_FALLBACK, config);
    return;
  }

  const { reply, handoff, calificacion, resumen_handoff, datos_detectados } = result.data;
  const { fotosParaEnviar, vehiculoFocoId } = result;

  const estadoSegunCalificacion = calificacion === "caliente" ? "calificando" : undefined;
  const patchConversacion: Record<string, unknown> = { calificacion };
  if (estadoSegunCalificacion) patchConversacion.estado_lead = estadoSegunCalificacion;
  if (vehiculoFocoId) patchConversacion.vehiculo_id = vehiculoFocoId;

  // Mismo criterio que WhatsApp/Instagram: si el auto en foco ya tiene
  // vendedor asignado en Stock y esta charla todavía no tiene vendedor, se
  // la asignamos a esa persona en vez de dejarla sin nadie (Messenger no
  // tiene round-robin propio todavía, ver migración de Messenger).
  if (vehiculoFocoId && !conversacionActual?.vendedor_id) {
    const { data: vehiculoFoco } = await supabase.from("vehiculos").select("vendedor_asignado_id, vendedor:vendedor_asignado_id ( activo )").eq("id", vehiculoFocoId).maybeSingle();
    const vendedorAsignadoActivo = vehiculoFoco?.vendedor as { activo?: boolean } | { activo?: boolean }[] | null | undefined;
    const estaActivo = Array.isArray(vendedorAsignadoActivo) ? vendedorAsignadoActivo[0]?.activo : vendedorAsignadoActivo?.activo;
    if (vehiculoFoco?.vendedor_asignado_id && estaActivo) {
      patchConversacion.vendedor_id = vehiculoFoco.vendedor_asignado_id;
      patchConversacion.estado_lead = "asignado";
    }
  }

  await supabase.from("messenger_conversaciones").update(patchConversacion).eq("id", conversacionId);

  if (datos_detectados?.nombre && conversacionActual?.contacto_id) {
    await supabase.from("messenger_contactos").update({ nombre_perfil: datos_detectados.nombre }).eq("id", conversacionActual.contacto_id);
  }

  for (const parte of dividirRespuestaEnMensajes(reply)) {
    const { data: mensajeSaliente } = await supabase.from("messenger_mensajes").insert({ conversacion_id: conversacionId, direccion: "out", tipo: "text", texto: parte, status: "pending", ai_generado: true }).select("id").single();
    if (mensajeSaliente) await enviarYActualizarMensaje(mensajeSaliente.id, psid, parte, config);
  }

  for (const fotoUrl of fotosParaEnviar) {
    const { data: mensajeFoto } = await supabase.from("messenger_mensajes").insert({ conversacion_id: conversacionId, direccion: "out", tipo: "image", media_url: fotoUrl, status: "pending", ai_generado: true }).select("id").single();
    if (mensajeFoto) await enviarYActualizarImagen(mensajeFoto.id, psid, fotoUrl, config);
  }

  if (handoff) {
    await supabase.from("messenger_conversaciones").update({
      handoff_at: new Date().toISOString(), handoff_reason: "cliente_pidio_humano",
      handoff_resumen: resumen_handoff || null,
      ai_habilitada: false,
    }).eq("id", conversacionId);
    // La alerta de handoff la dispara el trigger sobre messenger_mensajes.
  }
}

async function enviarYActualizarMensaje(mensajeId: string, psid: string, texto: string, config: any) {
  if (!isMessengerEnvioConfigurado(config)) {
    console.warn("[webhook-messenger] Messenger no está configurado — mensaje queda 'pending' sin enviar.");
    return;
  }

  try {
    const tokenPlano = decrypt(config.token_cifrado, config.token_iv, config.token_tag);
    const resultado = await sendMessengerMessage(config.page_id, tokenPlano, psid, texto);
    await supabase.from("messenger_mensajes").update({ status: "sent", messenger_message_id: resultado.message_id }).eq("id", mensajeId);
  } catch (err) {
    registrarError("webhook-messenger:enviar-mensaje", err, { mensajeId, psid });
    await supabase.from("messenger_mensajes").update({ status: "failed" }).eq("id", mensajeId);
  }
}

async function enviarYActualizarImagen(mensajeId: string, psid: string, imageUrl: string, config: any) {
  if (!isMessengerEnvioConfigurado(config)) return;

  try {
    const tokenPlano = decrypt(config.token_cifrado, config.token_iv, config.token_tag);
    await sendMessengerImageMessage(config.page_id, tokenPlano, psid, imageUrl);
    await supabase.from("messenger_mensajes").update({ status: "sent" }).eq("id", mensajeId);
  } catch (err) {
    registrarError("webhook-messenger:enviar-imagen", err, { mensajeId, psid });
    await supabase.from("messenger_mensajes").update({ status: "failed" }).eq("id", mensajeId);
  }
}

// Echo de cualquier mensaje saliente de la página -- del bot (ya guardado,
// tiene messenger_message_id) o de un empleado contestando a mano. Se
// distingue por messenger_message_id: si ya existe, es un echo de un
// mensaje nuestro (se ignora); si no, es una respuesta manual real.
async function procesarEcho(msg: any) {
  const messageId = msg.message?.mid;
  const { texto, tipo, mediaUrl } = resolverTextoYMediaMessenger(msg.message);
  const psid = msg.recipient?.id; // en un echo, el cliente es el "recipient"
  if (!messageId || (!texto && !mediaUrl) || !psid) return;

  const { data: existente } = await supabase.from("messenger_mensajes").select("id").eq("messenger_message_id", messageId).maybeSingle();
  if (existente) return;

  const refs = await obtenerOCrearConversacion(psid, null);
  if (!refs) return;

  await supabase.from("messenger_mensajes").insert({
    conversacion_id: refs.conversacionId,
    messenger_message_id: messageId,
    direccion: "out",
    tipo,
    texto,
    media_url: mediaUrl,
    status: "sent",
    ai_generado: false,
  });
  await supabase.from("messenger_conversaciones").update({
    last_message_at: new Date().toISOString(),
    ai_habilitada: false,
  }).eq("id", refs.conversacionId);
}

// Recibo de lectura -- "messaging_seen". Si Meta manda "watermark" (todo lo
// anterior a esa marca de tiempo se vio) en vez de un mid puntual, se usa
// eso como corte.
async function procesarLectura(msg: any) {
  const psid = msg.sender?.id;
  const read = msg.read;
  if (!psid || !read) return;

  const { data: contacto } = await supabase.from("messenger_contactos").select("id").eq("psid", psid).maybeSingle();
  if (!contacto) return;
  const { data: conversacion } = await supabase.from("messenger_conversaciones").select("id").eq("contacto_id", contacto.id).maybeSingle();
  if (!conversacion) return;

  let corte: string | null = null;
  if (read.mid) {
    const { data: mensajeLeido } = await supabase.from("messenger_mensajes").select("created_at").eq("messenger_message_id", read.mid).maybeSingle();
    corte = mensajeLeido?.created_at ?? null;
  } else if (read.watermark) {
    corte = new Date(Number(read.watermark)).toISOString();
  }
  if (!corte) return;

  const { error } = await supabase.from("messenger_mensajes")
    .update({ leido_at: new Date().toISOString() })
    .eq("conversacion_id", conversacion.id)
    .eq("direccion", "out")
    .is("leido_at", null)
    .lte("created_at", corte);
  if (error) registrarError("webhook-messenger:lectura", error, { psid });
}
