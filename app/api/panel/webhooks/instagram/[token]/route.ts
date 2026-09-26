import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { isAiConfiguredV2 } from "@/lib/ai/indexV2";
import { generarRespuestaAgenteV2, dividirRespuestaEnMensajes } from "@/lib/ai/agenteV2";
import { sendInstagramPrivateReply, sendInstagramMessage, sendInstagramImageMessage, replyToInstagramCommentPublicly, getInstagramUserProfile } from "@/lib/meta/client";
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

// El colchón de DEBOUNCE_MS (ver más abajo) se suma al tiempo de la función
// -- sin este límite explícito corre el riesgo de superar el default de la
// plataforma antes de terminar de contestar. Mismo criterio que el webhook
// de WhatsApp.
export const maxDuration = 30;

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

// Mismo fix del 25/9 que ya tiene el webhook de WhatsApp: si el cliente
// manda dos (o más) mensajes casi seguidos por Instagram, el bot tiene que
// leerlos juntos antes de contestar, no contestar al primero y confundirse
// con el segundo. Se guardan TODOS los mensajes entrantes del payload
// primero (acá abajo, sin tocar al agente) y recién al final se dispara el
// agente una sola vez por conversación tocada -- así el historial que arma
// ejecutarAgente ya trae los mensajes juntos en vez de solo el primero.
async function procesarEvento(payload: any) {
  const conversacionesTocadas = new Map<string, { mensajeId: string; igUserId: string }>();
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field === "comments") {
        await procesarComentario(change.value);
      }
    }
    for (const msg of entry.messaging ?? []) {
      // Meta reenvía por este mismo webhook un "echo" de cada mensaje
      // saliente de la cuenta (msg.message.is_echo === true) -- del bot Y
      // de respuestas manuales de empleados desde la app de Instagram. Un
      // echo NUNCA se procesa como si fuera un mensaje nuevo del cliente
      // (eso hacía que el bot se contestara a sí mismo) -- se maneja aparte
      // en procesarEcho, que solo lo guarda si es una respuesta manual
      // real que todavía no estaba en la base.
      if (msg.message?.is_echo) {
        await procesarEcho(msg);
        continue;
      }
      // El cliente puede reaccionar con un emoji a un mensaje nuestro (doble
      // tap = ❤️, o mantener presionado y elegir otro) -- en la app real eso
      // se ve como un emoji chiquito pegado a la burbuja. Antes este evento
      // (messaging_reactions, ya suscripto en Meta) se ignoraba entero: la
      // reacción real del cliente no se veía en ningún lado del panel.
      if (msg.reaction) {
        await procesarReaccion(msg.reaction);
        continue;
      }
      // Recibo de lectura: el cliente abrió la charla y vio nuestros
      // mensajes -- en la app real eso se ve como "Visto" debajo del último
      // mensaje leído. Meta manda esto por "messaging_seen" (ya suscripto),
      // pero antes se ignoraba entero.
      if (msg.read) {
        await procesarLectura(msg);
        continue;
      }
      // Edición de un mensaje ya enviado por el cliente (Instagram permite
      // editar un DM después de mandarlo) -- "messaging_edit" ya suscripto,
      // pero antes se ignoraba y el panel se quedaba con el texto viejo.
      if (msg.message_edit) {
        await procesarEdicion(msg.message_edit);
        continue;
      }
      if (msg.message?.text || msg.message?.attachments?.length) {
        const resultado = await procesarMensajeDirecto(msg);
        if (resultado) conversacionesTocadas.set(resultado.conversacionId, { mensajeId: resultado.mensajeId, igUserId: resultado.igUserId });
      }
    }
  }
  for (const [conversacionId, { mensajeId, igUserId }] of conversacionesTocadas) {
    await ejecutarAgenteConDebounce(conversacionId, mensajeId, igUserId);
  }
}

// Además del caso de arriba (mismo payload), Meta puede mandar dos mensajes
// casi simultáneos del mismo cliente en DOS llamadas de webhook separadas --
// ahí no alcanza con agrupar dentro de procesarEvento porque son invocaciones
// distintas de la función. Se espera un colchón corto y, si en ese lapso
// llegó un mensaje más nuevo en esa conversación, esta invocación se retira
// sin contestar -- la invocación del mensaje más nuevo es la que va a
// terminar respondiendo, ya con el historial completo en la consulta que
// hace ejecutarAgente más abajo. Mismo patrón que el webhook de WhatsApp.
const DEBOUNCE_MS = 6000;

async function ejecutarAgenteConDebounce(conversacionId: string, mensajeId: string, igUserId: string) {
  await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS));
  const { data: ultimoEntrante } = await supabase
    .from("instagram_mensajes")
    .select("id")
    .eq("conversacion_id", conversacionId)
    .eq("direccion", "in")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (ultimoEntrante && ultimoEntrante.id !== mensajeId) return; // llegó algo más nuevo, esa invocación se encarga
  await ejecutarAgente(conversacionId, igUserId);
}

async function obtenerOCrearConversacion(igUserId: string, username: string | null) {
  // No pisar un username real ya guardado con null -- procesarMensajeDirecto
  // (los DM) no siempre trae el username en el evento, y antes este upsert
  // lo sobreescribía a null igual, borrando el @ que sí se había guardado
  // antes desde un comentario. Se conserva el que ya había si el nuevo viene vacío.
  const { data: contactoExistente } = await supabase.from("instagram_contactos").select("id, username").eq("ig_user_id", igUserId).maybeSingle();
  const usernameFinal = username ?? contactoExistente?.username ?? null;

  const { data: contacto } = await supabase
    .from("instagram_contactos")
    .upsert({ ig_user_id: igUserId, username: usernameFinal }, { onConflict: "ig_user_id", ignoreDuplicates: false })
    .select("id")
    .single();
  if (!contacto) return null;

  let { data: conversacion } = await supabase
    .from("instagram_conversaciones")
    .select("id, vendedor_id, ai_habilitada, canal_origen, vehiculo_id")
    .eq("contacto_id", contacto.id)
    .maybeSingle();

  if (!conversacion) {
    // El trigger asignar_vendedor_conversacion_nueva_instagram le pone
    // vendedor solo (ronda) antes de que termine el insert.
    const { data: nueva } = await supabase
      .from("instagram_conversaciones")
      .insert({ contacto_id: contacto.id })
      .select("id, vendedor_id, ai_habilitada, canal_origen, vehiculo_id")
      .single();
    conversacion = nueva;
  }
  return conversacion
    ? { conversacionId: conversacion.id, contactoId: contacto.id, aiHabilitada: conversacion.ai_habilitada, canalOrigen: conversacion.canal_origen, vehiculoId: conversacion.vehiculo_id }
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

// Igual que resolverTextoMensaje del webhook de WhatsApp: un mensaje sin
// texto (foto/audio/video/sticker/compartir un posteo) no puede seguir
// perdiéndose -- antes esto se descartaba entero (ni cliente ni empleado
// veían nada guardado). Devuelve un texto placeholder legible para el
// agente/el panel, más el tipo y la URL real si Meta la manda.
function resolverTextoYMediaInstagram(message: any): { texto: string | null; tipo: string; mediaUrl: string | null } {
  if (message?.text) return { texto: message.text, tipo: "text", mediaUrl: null };
  const attachment = message?.attachments?.[0];
  if (!attachment) return { texto: null, tipo: "text", mediaUrl: null };
  const url: string | null = attachment.payload?.url ?? null;
  if (attachment.type === "image") return { texto: url ? null : "[Envió una foto]", tipo: "image", mediaUrl: url };
  if (attachment.type === "audio") return { texto: "🎤 Audio", tipo: "audio", mediaUrl: url };
  if (attachment.type === "video") return { texto: url ? null : "[Envió un video]", tipo: "video", mediaUrl: url };
  // "share" (posteo/reel compartido en el DM): Meta manda el link real en
  // payload.url -- antes se tiraba siempre, así que el panel mostraba texto
  // muerto sin poder abrir lo que el cliente compartió. Con el link se puede
  // al menos abrirlo, aunque no se arme la tarjeta con miniatura de Instagram.
  // Se guarda como tipo "text" (no un valor nuevo) para no arriesgar un
  // constraint de esa columna que no se puede verificar en este entorno --
  // el panel igual lo distingue por tener media_url sin ser imagen/audio/video.
  if (attachment.type === "share") return { texto: url ? null : "[Compartió una publicación/reel]", tipo: "text", mediaUrl: url };
  return { texto: "[Envió un archivo]", tipo: "text", mediaUrl: null };
}

async function procesarMensajeDirecto(msg: any): Promise<{ conversacionId: string; mensajeId: string; igUserId: string } | null> {
  const igUserId = msg.sender?.id;
  const { texto, tipo, mediaUrl } = resolverTextoYMediaInstagram(msg.message);
  const igMessageId = msg.message?.mid;
  if (!igUserId || (!texto && !mediaUrl)) return null;

  // A diferencia de un comentario (Meta manda el username directo), un DM
  // entrante solo trae el IGSID numérico -- sin esto el contacto quedaba
  // guardado con username null y el panel lo mostraba como "@" + el ID
  // numérico en vez del @usuario real. Solo se pide si todavía no lo
  // tenemos guardado (evita pegarle a la API de Meta en cada mensaje).
  const { data: contactoPrevio } = await supabase.from("instagram_contactos").select("username").eq("ig_user_id", igUserId).maybeSingle();
  let usernameResuelto: string | null = contactoPrevio?.username ?? null;
  if (!usernameResuelto) {
    const { data: config } = await supabase.from("instagram_configuracion").select("token_cifrado, token_iv, token_tag").eq("id", true).single();
    if (config?.token_cifrado && config.token_iv && config.token_tag) {
      try {
        const tokenPlano = decrypt(config.token_cifrado, config.token_iv, config.token_tag);
        const perfil = await getInstagramUserProfile(tokenPlano, igUserId);
        usernameResuelto = perfil.username ?? null;
      } catch (err) {
        registrarError("webhook-ig-v2:resolver-username", err, { igUserId });
      }
    }
  }

  const refs = await obtenerOCrearConversacion(igUserId, usernameResuelto);
  if (!refs) return null;

  // Meta manda "referral" en el evento de mensaje cuando la charla arrancó
  // desde un anuncio de Click-to-Instagram o el botón "Enviar mensaje" de
  // un posteo/story -- mismo patrón que el webhook de WhatsApp (ver ese
  // archivo). Mismo vocabulario que lib/utm.ts para hablar el mismo idioma
  // que /panel/marketing/pautas.
  if (msg.referral && !refs.canalOrigen) {
    await supabase.from("instagram_conversaciones").update({ canal_origen: "Meta Ads" }).eq("id", refs.conversacionId);
  }

  const { data: mensajeInsertado, error } = await supabase.from("instagram_mensajes").insert({
    conversacion_id: refs.conversacionId,
    ig_message_id: igMessageId,
    direccion: "in",
    tipo,
    texto,
    media_url: mediaUrl,
    status: "received",
  }).select("id").single();
  if (error) {
    if (error.code === "23505") return null; // duplicado, Meta reintentó el mismo evento
    registrarError("webhook-ig-v2:insertar-mensaje", error, { conversacionId: refs.conversacionId });
    return null;
  }

  await supabase.from("instagram_conversaciones").update({
    last_inbound_at: new Date().toISOString(),
    last_message_at: new Date().toISOString(),
  }).eq("id", refs.conversacionId);
  // Alerta de "nuevo mensaje" la dispara el trigger sobre instagram_mensajes.

  return { conversacionId: refs.conversacionId, mensajeId: mensajeInsertado.id, igUserId };
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

  const { data: conversacionActual } = await supabase.from("instagram_conversaciones").select("ai_habilitada, contacto_id, vehiculo_id").eq("id", conversacionId).single();
  if (conversacionActual?.ai_habilitada === false) return;

  const { data: mensajes } = await supabase.from("instagram_mensajes").select("direccion, texto").eq("conversacion_id", conversacionId).order("created_at", { ascending: true }).limit(20);
  const historial = (mensajes ?? []).filter((m) => m.texto).map((m) => ({ role: (m.direccion === "in" ? "user" : "assistant") as "user" | "assistant", content: m.texto as string }));

  const { data: config } = await supabase.from("instagram_configuracion").select("*").eq("id", true).single();
  // Instagram tiene que sonar igual de profesional y serio que WhatsApp --
  // un vendedor real, no un amigo chateando. El admin puede pisar esto
  // cargando su propio tono en Configuración > Instagram, pero no depende
  // de que lo haga (el campo hoy suele estar vacío).
  const tonoInstagram = config?.tono?.trim() || "profesional y serio, como un vendedor de la concesionaria atendiendo por Instagram -- el mismo tono formal y directo que se usa en WhatsApp, sin informalidades ni frases de amigo (nada de \"che\", \"dale\", tratar al cliente como si fueran conocidos). Amable y claro, pero siempre con la seriedad de alguien vendiendo un vehículo, no charlando en redes sociales.";
  // "panel-v2/webhooks/instagram", no "panel/webhooks/instagram" -- este
  // string es lo que uso_ia_anthropic.origen guarda para el costo de IA de
  // cada llamada (ver agenteV2.ts, { origen: canal }), y Marketing > Instagram
  // / Marketing > Generales filtran por "panel-v2/webhooks/instagram" para
  // armar la tarjeta "Costo IA" -- con el prefijo mal puesto el filtro nunca
  // matcheaba nada y la tarjeta quedaba siempre en "—" aunque hubiera uso real.
  const result = await generarRespuestaAgenteV2(historial, "panel-v2/webhooks/instagram", undefined, conversacionActual?.vehiculo_id ?? null, tonoInstagram, true);

  if (!result.ok) {
    registrarError("webhook-ig-v2:agente", result.error, { conversacionId });
    const { data: mensajeFallback } = await supabase.from("instagram_mensajes").insert({ conversacion_id: conversacionId, direccion: "out", tipo: "text", texto: RESPUESTA_FALLBACK, status: "pending", ai_generado: false }).select("id").single();
    if (mensajeFallback) await enviarYActualizarMensaje(mensajeFallback.id, igUserId, RESPUESTA_FALLBACK, config);
    return;
  }

  const { reply, handoff, calificacion, resumen_handoff, datos_detectados } = result.data;
  const { fotosParaEnviar, vehiculoFocoId } = result;

  const estadoSegunCalificacion = calificacion === "caliente" ? "calificando" : undefined;
  const patchConversacion: Record<string, unknown> = { calificacion };
  if (estadoSegunCalificacion) patchConversacion.estado_lead = estadoSegunCalificacion;
  // Mismo motivo que WhatsApp (webhooks/whatsapp/[token]/route.ts): guardar
  // el auto en foco acá es lo que le permite al agente responder bien datos
  // puntuales (color, km, patente, versión, etc.) en preguntas de
  // seguimiento que no repiten el modelo -- sin esto, Instagram solo tenía
  // el historial de texto para "acordarse" del auto, y con el modelo chico
  // se perdía o confundía a los pocos mensajes.
  if (vehiculoFocoId) patchConversacion.vehiculo_id = vehiculoFocoId;
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

  // Fotos del auto que el agente mostró en esta respuesta -- mismo patrón
  // que WhatsApp (webhooks/whatsapp/[token]/route.ts), Instagram sí soporta
  // mandar imágenes por DM (a diferencia de Rodi, que nunca lo hace).
  for (const fotoUrl of fotosParaEnviar) {
    const { data: mensajeFoto } = await supabase.from("instagram_mensajes").insert({ conversacion_id: conversacionId, direccion: "out", tipo: "image", media_url: fotoUrl, status: "pending", ai_generado: true }).select("id").single();
    if (mensajeFoto) await enviarYActualizarImagen(mensajeFoto.id, igUserId, fotoUrl, config);
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
    // Guardamos el message_id real que devuelve Meta -- Meta reenvía este
    // mismo mensaje como "echo" por el webhook unos segundos después (ver
    // procesarEcho más abajo); con el id guardado, ese echo se reconoce
    // como "ya lo tengo" y no se duplica en el chat del panel.
    const resultado = await sendInstagramMessage(config.ig_user_id, tokenPlano, igUserId, texto);
    await supabase.from("instagram_mensajes").update({ status: "sent", ig_message_id: resultado.message_id }).eq("id", mensajeId);
  } catch (err) {
    registrarError("webhook-ig-v2:enviar-dm", err, { mensajeId, igUserId });
    await supabase.from("instagram_mensajes").update({ status: "failed" }).eq("id", mensajeId);
  }
}

// Meta reenvía por el mismo webhook un "echo" de CUALQUIER mensaje saliente
// de la cuenta -- tanto los que manda el bot (ya guardados por nosotros
// arriba, con ig_message_id) como los que un empleado escribe a mano desde
// la app de Instagram (esos nunca pasaron por nuestro código, no están en
// la base todavía). Antes se ignoraban todos los echoes por igual -- eso
// frenaba al bot de contestarse a sí mismo, pero de paso dejaba las
// respuestas manuales de los empleados invisibles en el panel (pedido
// explícito: "el panel tiene que ser un espejo exacto de Instagram"). Acá
// se distingue por ig_message_id: si ya existe, es un echo de un mensaje
// nuestro (se ignora); si no existe, es una respuesta manual real (se
// guarda como "out", sin ai_generado, y se pausa la IA para esa charla).
async function procesarEcho(msg: any) {
  const igMessageId = msg.message?.mid;
  const { texto, tipo, mediaUrl } = resolverTextoYMediaInstagram(msg.message);
  const igUserId = msg.recipient?.id; // en un echo, el cliente es el "recipient", no el "sender"
  if (!igMessageId || (!texto && !mediaUrl) || !igUserId) return;

  const { data: existente } = await supabase.from("instagram_mensajes").select("id").eq("ig_message_id", igMessageId).maybeSingle();
  if (existente) return; // echo de un mensaje que ya mandó el bot -- nada que hacer

  const refs = await obtenerOCrearConversacion(igUserId, null);
  if (!refs) return;

  await supabase.from("instagram_mensajes").insert({
    conversacion_id: refs.conversacionId,
    ig_message_id: igMessageId,
    direccion: "out",
    tipo,
    texto,
    media_url: mediaUrl,
    status: "sent",
    ai_generado: false,
  });
  await supabase.from("instagram_conversaciones").update({
    last_message_at: new Date().toISOString(),
    ai_habilitada: false, // un humano ya está atendiendo esta charla a mano -- el bot no debe pisarlo
  }).eq("id", refs.conversacionId);
}

// Reacción del cliente a un mensaje puntual (mid = el ig_message_id de ESE
// mensaje, no de la conversación). "unreact" pasa cuando saca la reacción
// que había puesto -- se limpia la columna en vez de dejar la vieja pegada.
// Update best-effort: si migraciones/sql_instagram_mensajes_reaccion.sql
// todavía no corrió (columna no existe), esto falla solo y el resto del
// webhook sigue andando igual (mismo patrón resiliente que el resto del
// archivo).
// Meta a veces manda la reacción como palabra clave en vez del emoji real
// (herencia del Messenger Platform viejo) -- sin este mapeo el panel mostraba
// literalmente "love" pegado a la burbuja en vez del corazón que el cliente
// tocó de verdad en la app.
const EMOJI_POR_PALABRA_CLAVE: Record<string, string> = {
  love: "❤️", like: "👍", wow: "😮", haha: "😆", sad: "😢", angry: "😠",
};

async function procesarReaccion(reaction: any) {
  const mid = reaction?.mid;
  if (!mid) return;
  const crudo = reaction.action === "unreact" ? null : (reaction.emoji || reaction.reaction || null);
  const emoji = crudo ? (EMOJI_POR_PALABRA_CLAVE[crudo.toLowerCase()] || crudo) : null;
  const { error } = await supabase.from("instagram_mensajes").update({ reaccion: emoji }).eq("ig_message_id", mid);
  if (error) registrarError("webhook-ig-v2:reaccion", error, { mid });
}

// Recibo de lectura. El sender de un evento "read" es el CLIENTE (confirma
// que vio lo que le mandamos) -- Meta identifica hasta dónde leyó con
// read.mid (el id del último mensaje que vio) o read.watermark (un
// timestamp: "todo lo mandado antes de esto ya se vio"). Se soportan los
// dos formatos porque no hay forma de confirmar cuál manda Instagram en
// este entorno sin tráfico real -- si ninguno viene, no se marca nada (mejor
// no marcar que marcar mal). No usa obtenerOCrearConversacion a propósito:
// un recibo de lectura nunca debería crear una conversación nueva -- si no
// existe todavía, no hay nada que marcar como leído.
async function procesarLectura(msg: any) {
  const igUserId = msg.sender?.id;
  const read = msg.read;
  if (!igUserId || !read) return;

  const { data: contacto } = await supabase.from("instagram_contactos").select("id").eq("ig_user_id", igUserId).maybeSingle();
  if (!contacto) return;
  const { data: conversacion } = await supabase.from("instagram_conversaciones").select("id").eq("contacto_id", contacto.id).maybeSingle();
  if (!conversacion) return;

  let corte: string | null = null;
  if (read.mid) {
    const { data: mensajeLeido } = await supabase.from("instagram_mensajes").select("created_at").eq("ig_message_id", read.mid).maybeSingle();
    corte = mensajeLeido?.created_at ?? null;
  } else if (read.watermark) {
    corte = new Date(Number(read.watermark)).toISOString();
  }
  if (!corte) return;

  const { error } = await supabase.from("instagram_mensajes")
    .update({ leido_at: new Date().toISOString() })
    .eq("conversacion_id", conversacion.id)
    .eq("direccion", "out")
    .is("leido_at", null)
    .lte("created_at", corte);
  if (error) registrarError("webhook-ig-v2:lectura", error, { igUserId });
}

// Edición de un mensaje ya enviado -- mid identifica CUÁL mensaje se editó,
// text trae el contenido nuevo. Se marca "editado: true" para que el panel
// pueda avisar que ese texto no es el original (igual que hace la propia
// app de Instagram con la etiqueta "Editado").
async function procesarEdicion(edicion: any) {
  const mid = edicion?.mid;
  const textoNuevo = edicion?.text;
  if (!mid || textoNuevo == null) return;
  const { error } = await supabase.from("instagram_mensajes").update({ texto: textoNuevo, editado: true }).eq("ig_message_id", mid);
  if (error) registrarError("webhook-ig-v2:edicion", error, { mid });
}

// Best-effort, igual que la de WhatsApp: si falla la foto no rompe la
// conversación, el texto ya se mandó antes.
async function enviarYActualizarImagen(mensajeId: string, igUserId: string, imageUrl: string, config: any) {
  if (!isInstagramEnvioConfigurado(config)) return;

  try {
    const tokenPlano = decrypt(config.token_cifrado, config.token_iv, config.token_tag);
    await sendInstagramImageMessage(config.ig_user_id, tokenPlano, igUserId, imageUrl);
    await supabase.from("instagram_mensajes").update({ status: "sent" }).eq("id", mensajeId);
  } catch (err) {
    registrarError("webhook-ig-v2:enviar-imagen", err, { mensajeId, igUserId });
    await supabase.from("instagram_mensajes").update({ status: "failed" }).eq("id", mensajeId);
  }
}
