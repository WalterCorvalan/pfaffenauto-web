import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { isAiConfiguredV2 } from "@/lib/ai/indexV2";
import { generarRespuestaAgenteV2, dividirRespuestaEnMensajes } from "@/lib/ai/agenteV2";
import { sendTextMessage, sendImageMessage } from "@/lib/meta/client";
import { decrypt } from "@/lib/crypto";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/panel/logger";
import { buscarRespuestaMemoria, buscarRespuestaFueraHorario } from "@/lib/panel/whatsappMemoria";
import { notificarPersona, notificarEncargados } from "@/lib/panel/notificaciones";
import { resolverFechaVisita } from "@/lib/fechas";

// Webhook de Meta para el WhatsApp de panel-v2 (Conversaciones → WhatsApp,
// replica /panel/chat de v1: bandeja de mensajes reales de clientes con
// asignación por ronda, con el mismo agente de respuesta automática que ya
// tenía v1 ahí). Sin relación con Rodi — Rodi es el chatbot del sitio
// público (home), un módulo totalmente aparte. Las credenciales (token del
// bot, phone_number_id, webhook_verify_token) están cifradas en
// whatsapp_configuracion (Configuración → WhatsApp), no en env vars como v1
// — así cada instalación puede tener su propio número sin redeployar.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

async function tokenValido(token: string): Promise<boolean> {
  const { data } = await supabase.from("whatsapp_configuracion").select("webhook_verify_token").eq("id", true).single();
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

  const { data: config } = await supabase.from("whatsapp_configuracion").select("webhook_verify_token").eq("id", true).single();
  if (mode === "subscribe" && verifyToken === config?.webhook_verify_token) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  // Endpoint público — Meta reintenta legítimo, pero sin límite cualquiera
  // que le pegue directo a la URL puede disparar llamadas pagas a Anthropic
  // sin freno. Generoso (60/min) para no frenar entregas reales de Meta.
  const limite = await rateLimit(ipDesdeRequest(req), { limite: 60, ventanaMs: 60 * 1000, proyecto: "v2" });
  if (!limite.ok) return new Response("Too many requests", { status: 429 });

  const { token } = await params;
  if (!(await tokenValido(token))) return new Response("Not found", { status: 404 });

  const rawBody = await req.text();

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error("[webhook-v2] META_APP_SECRET no está configurada.");
    return new Response("Unauthorized", { status: 401 });
  }

  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  // Hay que esperar el procesamiento antes de responder: en el runtime
  // serverless de Vercel, la función se congela apenas se devuelve la
  // respuesta, así que "fire and forget" nunca llega a terminar y el
  // mensaje entrante se pierde sin guardarse.
  try {
    await procesarEvento(payload);
  } catch (err) {
    registrarError("webhook-v2:procesar-evento", err);
  }

  return Response.json({ received: true });
}

async function procesarEvento(payload: any) {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (change.field !== "messages") continue;

      for (const msg of value.messages ?? []) {
        const waId = msg.from;
        const nombrePerfil = value.contacts?.find((c: any) => c.wa_id === waId)?.profile?.name ?? null;
        await ingestarMensaje({ waId, nombrePerfil, msg });
      }
      for (const status of value.statuses ?? []) {
        await actualizarEstadoMensaje(status);
      }
    }
  }
}

// Antes, cualquier mensaje que no fuera texto/interactive (audio, foto,
// video, documento) se guardaba con texto=null y quedaba invisible para el
// agente -- ejecutarAgente arma el historial filtrando ".filter(m => m.texto)",
// así que el cliente mandaba un audio y el bot se quedaba en silencio total,
// sin ni siquiera avisar que no pudo escucharlo. Se resuelve un texto real
// para cada tipo -- sin transcripción automática de audio (a propósito: se
// notifica al vendedor para que lo escuche él mismo, ver notificarAudioRecibido).
function resolverTextoMensaje(msg: any): string | null {
  if (msg.type === "text") return msg.text?.body ?? null;
  if (msg.type === "interactive") return msg.interactive?.list_reply?.title ?? msg.interactive?.button_reply?.title ?? null;
  if (msg.type === "audio") return "[Cliente envió un audio 🎤 -- escuchalo en tu WhatsApp]";
  if (msg.type === "image") return msg.image?.caption?.trim() || "[Cliente envió una foto sin descripción]";
  if (msg.type === "video") return msg.video?.caption?.trim() || "[Cliente envió un video]";
  if (msg.type === "document") return msg.document?.caption?.trim() || msg.document?.filename || "[Cliente envió un documento]";
  return null;
}

async function ingestarMensaje({ waId, nombrePerfil, msg }: { waId: string; nombrePerfil: string | null; msg: any }) {
  // Solo se completa nombre_perfil al crear el contacto por primera vez --
  // si ya existe, NO se pisa con el nombre de perfil de WhatsApp en cada
  // mensaje entrante, porque eso borraba el nombre real que el cliente ya
  // había dado en la charla (el agente lo guarda apenas lo detecta).
  let { data: contacto } = await supabase.from("whatsapp_contactos").select("id").eq("telefono", waId).maybeSingle();
  if (!contacto) {
    const { data: nuevo, error: errInsert } = await supabase.from("whatsapp_contactos").insert({ telefono: waId, nombre_perfil: nombrePerfil }).select("id").single();
    if (errInsert && errInsert.code === "23505") {
      // Dos mensajes casi simultáneos del mismo contacto nuevo -- el otro ya
      // lo insertó primero, lo buscamos de nuevo en vez de fallar.
      ({ data: contacto } = await supabase.from("whatsapp_contactos").select("id").eq("telefono", waId).maybeSingle());
    } else {
      contacto = nuevo;
    }
  }
  if (!contacto) return;

  let { data: conversacion } = await supabase
    .from("whatsapp_conversaciones")
    .select("id, vendedor_id, ai_habilitada")
    .eq("contacto_id", contacto.id)
    .maybeSingle();

  if (!conversacion) {
    // El trigger asignar_vendedor_conversacion_nueva le pone vendedor solo
    // (ronda) antes de que termine el insert.
    const { data: nueva } = await supabase.from("whatsapp_conversaciones").insert({ contacto_id: contacto.id }).select("id, vendedor_id, ai_habilitada").single();
    conversacion = nueva;
  }
  if (!conversacion) return;

  if (msg.referral?.headline) {
    await supabase.from("whatsapp_conversaciones").update({ origen_ads: msg.referral.headline }).eq("id", conversacion.id);
  }

  // Cuando el cliente toca una opción de la lista interactiva del menú de
  // bienvenida, Meta manda type "interactive" con interactive.list_reply en
  // vez de texto — se usa el título de la opción como si lo hubiera tipeado,
  // así el agente lo procesa igual que cualquier mensaje de texto.
  const texto = resolverTextoMensaje(msg);
  const { error } = await supabase.from("whatsapp_mensajes").insert({
    conversacion_id: conversacion.id,
    wa_message_id: msg.id,
    direccion: "in",
    tipo: msg.type ?? "text",
    texto,
    status: "received",
    wa_timestamp: new Date(Number(msg.timestamp) * 1000).toISOString(),
  });
  if (error) {
    if (error.code === "23505") return; // duplicado (reintento de Meta)
    registrarError("webhook-v2:insertar-mensaje", error, { conversacionId: conversacion.id });
    return;
  }

  const { data: convActual } = await supabase.from("whatsapp_conversaciones").select("unread_count, vendedor_id").eq("id", conversacion.id).single();
  await supabase.from("whatsapp_conversaciones").update({ last_inbound_at: new Date().toISOString(), last_message_at: new Date().toISOString(), unread_count: (convActual?.unread_count ?? 0) + 1 }).eq("id", conversacion.id);

  // La alerta de "nuevo mensaje" la dispara el trigger trg_whatsapp_mensaje_
  // entrante sobre whatsapp_mensajes (avisa al vendedor asignado, o a todo
  // admin/encargado/ventas si todavía no tiene uno) -- llamarlo también
  // desde acá duplicaba la alerta.

  await ejecutarAgente(conversacion.id);
}

const RESPUESTA_FALLBACK = "¡Hola! Gracias por escribirnos a Pfaffen Autos. En breve te contacta uno de nuestros asesores. 🚗";

function isWhatsappEnvioConfigurado(config: any): boolean {
  return !!config?.listo && !!config?.token_cifrado && !!config?.token_iv && !!config?.token_tag && !!config?.phone_number_id;
}

// Horario de atención: 8 a 22, hora Argentina — mismo criterio que v1.
function estaEnHorarioAtencion(): boolean {
  const hora = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return hora >= 8 && hora < 22;
}

async function enviarMensajeFijo(conversacionId: string, texto: string, config: any) {
  const { data: mensajeSaliente } = await supabase.from("whatsapp_mensajes").insert({ conversacion_id: conversacionId, direccion: "out", tipo: "text", texto, status: "pending", ai_generado: false }).select("id").single();
  if (mensajeSaliente) await enviarYActualizarMensaje(mensajeSaliente.id, conversacionId, texto, config);
}

async function ejecutarAgente(conversacionId: string) {
  const { data: conversacionActual } = await supabase.from("whatsapp_conversaciones").select("ai_habilitada, fuera_horario_avisado_fecha, vehiculo_id").eq("id", conversacionId).single();
  if (conversacionActual?.ai_habilitada === false) return;

  const { data: config } = await supabase.from("whatsapp_configuracion").select("*").eq("id", true).single();

  if (!estaEnHorarioAtencion()) {
    const hoy = new Date().toISOString().split("T")[0];
    if (conversacionActual?.fuera_horario_avisado_fecha === hoy) return; // ya se avisó hoy, no repetir
    const avisoFueraHorario = await buscarRespuestaFueraHorario(supabase);
    if (avisoFueraHorario) {
      await enviarMensajeFijo(conversacionId, avisoFueraHorario, config);
      await supabase.from("whatsapp_conversaciones").update({ fuera_horario_avisado_fecha: hoy }).eq("id", conversacionId);
    }
    return;
  }

  // Ojo: ascending+limit trae los primeros 20 mensajes de TODA la charla,
  // no los últimos 20 -- en una charla larga el bot quedaba viendo siempre
  // el arranque de la conversación y nunca lo que se habló después. Se pide
  // descendente (los más recientes) y se da vuelta para volver a dejarlos en
  // orden cronológico antes de mandarlos como historial.
  const { data: mensajesDesc } = await supabase.from("whatsapp_mensajes").select("direccion, texto").eq("conversacion_id", conversacionId).order("created_at", { ascending: false }).limit(20);
  const mensajes = mensajesDesc ? [...mensajesDesc].reverse() : mensajesDesc;
  const historial = (mensajes ?? []).filter((m) => m.texto).map((m) => ({ role: (m.direccion === "in" ? "user" : "assistant") as "user" | "assistant", content: m.texto as string }));

  // "Memoria" primero (palabras clave, sin costo de IA) -- solo se llama a la
  // IA si la última pregunta del cliente no matchea nada fijo (horarios,
  // ubicación, formas de pago, datos de la empresa), mismo criterio que
  // /api/buscar-ia con la DB.
  const ultimoMensajeCliente = [...historial].reverse().find((m) => m.role === "user")?.content;
  if (ultimoMensajeCliente) {
    const respuestaMemoria = await buscarRespuestaMemoria(supabase, ultimoMensajeCliente);
    if (respuestaMemoria) {
      await enviarMensajeFijo(conversacionId, respuestaMemoria, config);
      return;
    }
  }

  if (!isAiConfiguredV2()) return;

  const result = await generarRespuestaAgenteV2(historial, "panel-v2/webhooks/whatsapp", undefined, conversacionActual?.vehiculo_id ?? null);

  if (!result.ok) {
    registrarError("webhook-v2:agente", result.error, { conversacionId });
    const { data: mensajeFallback } = await supabase.from("whatsapp_mensajes").insert({ conversacion_id: conversacionId, direccion: "out", tipo: "text", texto: RESPUESTA_FALLBACK, status: "pending", ai_generado: false }).select("id").single();
    if (mensajeFallback) await enviarYActualizarMensaje(mensajeFallback.id, conversacionId, RESPUESTA_FALLBACK, config);
    return;
  }

  const { reply, handoff, pausar_sin_notificar, calificacion, resumen_handoff, datos_detectados } = result.data;
  const { fotosParaEnviar, vehiculoFocoId, pedidoStock } = result;

  const estadoSegunCalificacion = calificacion === "caliente" ? "calificando" : undefined;
  const patchConversacion: Record<string, unknown> = { calificacion };
  if (estadoSegunCalificacion) patchConversacion.estado_lead = estadoSegunCalificacion;
  if (vehiculoFocoId) patchConversacion.vehiculo_id = vehiculoFocoId;
  await supabase.from("whatsapp_conversaciones").update(patchConversacion).eq("id", conversacionId);

  // Nombre y mail que el cliente vaya dando durante la charla se guardan en
  // el contacto apenas se detectan, sin esperar al handoff — así quedan
  // aunque la charla se corte antes de derivar a un vendedor.
  let contactoIdActual: string | null = null;
  if (datos_detectados?.nombre || datos_detectados?.email || datos_detectados?.cuil) {
    const { data: conv } = await supabase.from("whatsapp_conversaciones").select("contacto_id").eq("id", conversacionId).single();
    contactoIdActual = conv?.contacto_id ?? null;
    if (contactoIdActual) {
      const patchContacto: Record<string, unknown> = {};
      if (datos_detectados.nombre) patchContacto.nombre_perfil = datos_detectados.nombre;
      if (datos_detectados.email) patchContacto.email = datos_detectados.email;
      if (datos_detectados.cuil) patchContacto.cuil = datos_detectados.cuil;
      const { error: errorContacto } = await supabase.from("whatsapp_contactos").update(patchContacto).eq("id", contactoIdActual);
      if (errorContacto) registrarError("webhook-v2:patch-contacto", errorContacto, { conversacionId });
    }
  }

  // Sin stock que coincida: el bot ya avisó que va a notificar apenas entre
  // un auto así -- queda registrado en Pedidos con lo que se sabe hasta
  // ahora (aunque sea parcial), para que reasignar_pedidos_vencidos y el
  // match automático de stock nuevo lo tengan en cuenta.
  if (pedidoStock?.marca) {
    const { data: convParaPedido } = await supabase.from("whatsapp_conversaciones").select("vendedor_id, contacto_id, whatsapp_contactos(telefono, nombre_perfil)").eq("id", conversacionId).single();
    const telefonoContacto = (convParaPedido?.whatsapp_contactos as any)?.telefono;
    if (telefonoContacto) {
      // "nombre_cliente" es NOT NULL en "pedidos" -- fallback para no perder
      // el pedido si todavía no tenemos el nombre. "marca" también es NOT
      // NULL, pero esa la exige el prompt antes de completar pedido_stock
      // (ver regla SIN STOCK QUE COINCIDA) -- no se rellena con un fallback
      // acá porque un pedido con marca inventada no sirve para nada.
      const { error: errorPedido } = await supabase.from("pedidos").insert({
        telefono: telefonoContacto,
        nombre_cliente: datos_detectados?.nombre || (convParaPedido?.whatsapp_contactos as any)?.nombre_perfil || "Cliente de WhatsApp",
        marca: pedidoStock.marca, modelo: pedidoStock.modelo,
        presupuesto_max: pedidoStock.presupuesto_max, moneda: pedidoStock.moneda || "ARS",
        puertas: pedidoStock.puertas,
        vendedor_id: convParaPedido?.vendedor_id ?? null,
        origen: "whatsapp", tipo: "avisame", estado: "activo",
      });
      if (errorPedido) registrarError("webhook-v2:crear-pedido", errorPedido);
    }
  }

  // Cuando el agente muestra opciones de stock, "reply" viene partido en
  // varias burbujas (lista de autos + pregunta corta abajo) — se mandan como
  // mensajes de WhatsApp separados, en orden, no todo apelotonado en uno.
  for (const parte of dividirRespuestaEnMensajes(reply)) {
    const { data: mensajeSaliente } = await supabase.from("whatsapp_mensajes").insert({ conversacion_id: conversacionId, direccion: "out", tipo: "text", texto: parte, status: "pending", ai_generado: true }).select("id").single();
    if (mensajeSaliente) await enviarYActualizarMensaje(mensajeSaliente.id, conversacionId, parte, config);
  }

  for (const fotoUrl of fotosParaEnviar) {
    const { data: mensajeFoto } = await supabase.from("whatsapp_mensajes").insert({ conversacion_id: conversacionId, direccion: "out", tipo: "image", media_url: fotoUrl, status: "pending", ai_generado: true }).select("id").single();
    if (mensajeFoto) await enviarYActualizarImagen(mensajeFoto.id, conversacionId, fotoUrl, config);
  }

  if (handoff) {
    // CLIENTE OFENSIVO -- el bot ya respondió con altura y se pausa (misma
    // mecánica que un handoff normal, ai_habilitada false), pero A PROPÓSITO
    // no se asigna vendedor, no se notifica a nadie, ni se crea visita: es
    // una charla que se enfría sola, no una venta real para avisarle a un
    // vendedor. Si más adelante el cliente escribe algo normal, el flujo de
    // "reactivar tras pausa" ya existente lo retoma como cualquier otro.
    await supabase.from("whatsapp_conversaciones").update({
      handoff_at: new Date().toISOString(), handoff_reason: pausar_sin_notificar ? "cliente_ofensivo" : "cliente_pidio_humano",
      handoff_resumen: resumen_handoff || null, ai_habilitada: false,
    }).eq("id", conversacionId);

    if (pausar_sin_notificar) return;

    const { data: convHandoff } = await supabase.from("whatsapp_conversaciones").select("vendedor_id, contacto_id, whatsapp_contactos(telefono, nombre_perfil)").eq("id", conversacionId).single();
    const linkNoti = `/panel/whatsapp?conversacion=${conversacionId}`;
    const mensajeNoti = resumen_handoff || "El cliente pidió hablar con una persona — la IA dejó de responder.";
    let vendedorAsignado = convHandoff?.vendedor_id ?? null;

    // Venta/consignación/permuta del auto del cliente: si la charla no tiene
    // vendedor (nunca hubo un vehiculo_id de stock que dispare la asignación
    // por sucursal), pero SÍ sabemos la zona elegida, asignamos ahora mismo
    // por la misma ronda de esa sucursal -- antes esto cascadeaba a
    // "todos los encargados" sin ningún criterio real.
    let sucursalElegida: { id: string; nombre: string } | null = null;
    if (datos_detectados?.zona) {
      const { data } = await supabase.from("sucursales").select("id, nombre").eq("slug", datos_detectados.zona).maybeSingle();
      sucursalElegida = data;
    }
    if (!vendedorAsignado && sucursalElegida) {
      const { data: nuevoVendedorId } = await supabase.rpc("asignar_vendedor_ronda_whatsapp_por_sucursal", { p_sucursal_id: sucursalElegida.id });
      if (nuevoVendedorId) {
        vendedorAsignado = nuevoVendedorId;
        await supabase.from("whatsapp_conversaciones").update({ vendedor_id: nuevoVendedorId, estado_lead: "asignado" }).eq("id", conversacionId);
      }
    }

    if (vendedorAsignado) {
      notificarPersona(supabase, vendedorAsignado, sucursalElegida ? "whatsapp_venta_zona" : "whatsapp_handoff", mensajeNoti, linkNoti).catch((err) => console.error("[webhook-v2] error notificando handoff:", err));
    } else if (sucursalElegida) {
      // Ni un vendedor ni un encargado disponible en esa sucursal -- último
      // recurso, avisar en general (prioridad alta igual, es venta real).
      notificarEncargados(supabase, mensajeNoti, linkNoti, "whatsapp_venta_zona", sucursalElegida.id, "alta").catch((err) => console.error("[webhook-v2] error notificando zona:", err));
    } else {
      notificarEncargados(supabase, mensajeNoti, linkNoti, "whatsapp_handoff").catch((err) => console.error("[webhook-v2] error notificando handoff:", err));
    }

    // Día/horario confirmado para acercarse: se agenda como visita real en
    // el módulo Visitas, no queda solo en el texto de la charla para que el
    // vendedor tenga que volver a preguntarlo.
    if (datos_detectados?.dia_visita && datos_detectados?.horario_visita) {
      const telefonoCliente = (convHandoff?.whatsapp_contactos as any)?.telefono;
      const nombreCliente = datos_detectados?.nombre || (convHandoff?.whatsapp_contactos as any)?.nombre_perfil || "Cliente de WhatsApp";
      const { error: errorVisita } = await supabase.from("visitas").insert({
        vehiculo_marca: datos_detectados?.vehiculo_propio?.marca || null,
        vehiculo_modelo: datos_detectados?.vehiculo_propio?.modelo || null,
        nombre_cliente: nombreCliente,
        telefono_cliente: telefonoCliente || "sin dato",
        fecha_visita: resolverFechaVisita(datos_detectados.dia_visita),
        horario_visita: datos_detectados.horario_visita,
        sucursal: sucursalElegida?.nombre || "Sin especificar",
        estado: "Pendiente",
        vendedor_id: vendedorAsignado,
      });
      if (errorVisita) registrarError("webhook-v2:crear-visita", errorVisita);
    }
  }
}

async function enviarYActualizarMensaje(mensajeId: string, conversacionId: string, texto: string, config: any) {
  if (!isWhatsappEnvioConfigurado(config)) {
    console.warn("[webhook-v2] WhatsApp no está configurado — mensaje queda 'pending' sin enviar.");
    return;
  }

  const { data: conversacion } = await supabase.from("whatsapp_conversaciones").select("contacto_id, whatsapp_contactos(telefono)").eq("id", conversacionId).single();
  const telefono = (conversacion?.whatsapp_contactos as any)?.telefono;
  if (!telefono) return;

  try {
    const tokenPlano = decrypt(config.token_cifrado, config.token_iv, config.token_tag);
    const resultado = await sendTextMessage(config.phone_number_id, tokenPlano, telefono, texto);
    await supabase.from("whatsapp_mensajes").update({ status: "sent", wa_message_id: resultado.messages?.[0]?.id }).eq("id", mensajeId);
  } catch (err) {
    registrarError("webhook-v2:enviar-mensaje", err, { conversacionId, mensajeId });
    await supabase.from("whatsapp_mensajes").update({ status: "failed" }).eq("id", mensajeId);
  }
}

// Best-effort: si falla el envío de la foto no rompe la conversación, ya se
// mandó el texto antes. La URL de la foto ya es pública (mismo storage que
// usa el catálogo web), Meta la descarga directo del link.
async function enviarYActualizarImagen(mensajeId: string, conversacionId: string, imageUrl: string, config: any) {
  if (!isWhatsappEnvioConfigurado(config)) return;

  const { data: conversacion } = await supabase.from("whatsapp_conversaciones").select("contacto_id, whatsapp_contactos(telefono)").eq("id", conversacionId).single();
  const telefono = (conversacion?.whatsapp_contactos as any)?.telefono;
  if (!telefono) return;

  try {
    const tokenPlano = decrypt(config.token_cifrado, config.token_iv, config.token_tag);
    const resultado = await sendImageMessage(config.phone_number_id, tokenPlano, telefono, imageUrl);
    await supabase.from("whatsapp_mensajes").update({ status: "sent", wa_message_id: resultado.messages?.[0]?.id }).eq("id", mensajeId);
  } catch (err) {
    registrarError("webhook-v2:enviar-imagen", err, { conversacionId, mensajeId });
    await supabase.from("whatsapp_mensajes").update({ status: "failed" }).eq("id", mensajeId);
  }
}

async function actualizarEstadoMensaje(status: any) {
  const orden = ["pending", "sent", "delivered", "read"];
  const { data: msg } = await supabase.from("whatsapp_mensajes").select("id, status").eq("wa_message_id", status.id).maybeSingle();
  if (!msg) return;

  if (status.status === "failed") {
    await supabase.from("whatsapp_mensajes").update({ status: "failed" }).eq("id", msg.id);
    return;
  }
  const actualIdx = orden.indexOf(msg.status);
  const nuevoIdx = orden.indexOf(status.status);
  if (nuevoIdx > actualIdx) {
    await supabase.from("whatsapp_mensajes").update({ status: status.status }).eq("id", msg.id);
  }
}
