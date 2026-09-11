import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { generarRespuestaAgenteV2, dividirRespuestaEnMensajes } from "@/lib/ai/agenteV2";
import { isAiConfiguredV2 } from "@/lib/ai/indexV2";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/panel/logger";
import { notificarEncargados, notificarPersona } from "@/lib/panel/notificaciones";
import { resolverFechaVisita } from "@/lib/fechas";

// Endpoint público (sin sesión — lo llama el widget del sitio, un visitante
// anónimo) que procesa un mensaje de Rodi. Identidad = sessionId generado
// por el frontend del widget (uuid en localStorage), no hay teléfono.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

const MensajeSchema = z.object({
  sessionId: z.string().min(8).max(200),
  texto: z.string().trim().min(1).max(2000),
  origenPagina: z.string().max(300).optional(),
  nombre: z.string().max(200).optional(),
  telefono: z.string().max(50).optional(),
  email: z.string().email().max(200).optional(),
});

export async function POST(request: Request) {
  const limite = await rateLimit(ipDesdeRequest(request), { limite: 20, ventanaMs: 60 * 1000, proyecto: "v2" });
  if (!limite.ok) {
    return NextResponse.json({ error: "Demasiados mensajes. Esperá un momento." }, { status: 429 });
  }

  const parsed = MensajeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }
  const { sessionId, texto, origenPagina, nombre, telefono, email } = parsed.data;

  // Endpoint público del widget del sitio -- si algo revienta acá (red, IA,
  // supabase) antes no quedaba registro en ningún lado salvo los logs de
  // Vercel, invisibles desde el panel. Try/catch + registrarError para que
  // aparezca en Errores del sistema como cualquier otro canal.
  try {
    return await procesarMensaje({ sessionId, texto, origenPagina, nombre, telefono, email });
  } catch (err) {
    registrarError("api/panel/rodi/mensaje", err, { sessionId });
    return NextResponse.json({ replies: ["¡Hola! Gracias por escribirnos a Pfaffen Autos. En breve te contacta uno de nuestros asesores. 🚗"], handoff: false });
  }
}

async function procesarMensaje({ sessionId, texto, origenPagina, nombre, telefono, email }: {
  sessionId: string; texto: string; origenPagina?: string; nombre?: string; telefono?: string; email?: string;
}) {
  let { data: conversacion } = await supabase.from("rodi_conversaciones").select("*").eq("session_id", sessionId).maybeSingle();

  if (!conversacion) {
    const { data: nueva, error } = await supabase
      .from("rodi_conversaciones")
      .insert({ session_id: sessionId, origen_pagina: origenPagina || null, nombre_contacto: nombre || null, telefono_contacto: telefono || null, email_contacto: email || null })
      .select("*")
      .single();
    if (error || !nueva) {
      return NextResponse.json({ error: "No se pudo iniciar la conversación." }, { status: 500 });
    }
    conversacion = nueva;
  } else {
    const patch: Record<string, unknown> = {};
    if (nombre && !conversacion.nombre_contacto) patch.nombre_contacto = nombre;
    if (telefono && !conversacion.telefono_contacto) patch.telefono_contacto = telefono;
    if (email && !conversacion.email_contacto) patch.email_contacto = email;
    if (Object.keys(patch).length > 0) await supabase.from("rodi_conversaciones").update(patch).eq("id", conversacion.id);
  }

  await supabase.from("rodi_mensajes").insert({ conversacion_id: conversacion.id, direccion: "in", texto });
  await supabase.from("rodi_conversaciones").update({
    last_message_at: new Date().toISOString(),
    unread_count: (conversacion.unread_count ?? 0) + 1,
  }).eq("id", conversacion.id);

  if (conversacion.ai_habilitada === false) {
    // Se reactiva sola 6hs después de haberse pausado (handoff, mensaje
    // manual de un vendedor, o apagado a mano) -- si el visitante vuelve
    // más tarde, arranca de nuevo con el bot en vez de quedar en silencio
    // para siempre. Se resuelve acá mismo, sin depender de un cron.
    const SEIS_HORAS_MS = 6 * 60 * 60 * 1000;
    const pausadaHaceMs = conversacion.ai_pausada_en ? Date.now() - new Date(conversacion.ai_pausada_en).getTime() : null;
    if (pausadaHaceMs !== null && pausadaHaceMs >= SEIS_HORAS_MS) {
      await supabase.from("rodi_conversaciones").update({ ai_habilitada: true, ai_pausada_en: null, handoff_at: null, handoff_reason: null, handoff_resumen: null }).eq("id", conversacion.id);
      conversacion = { ...conversacion, ai_habilitada: true };
    } else {
      return NextResponse.json({ replies: [], handoff: true });
    }
  }

  if (!isAiConfiguredV2()) {
    return NextResponse.json({ replies: [], handoff: false });
  }

  // Mismo fix que WhatsApp: ascending+limit traía los primeros 20 mensajes
  // de toda la charla en vez de los últimos 20 -- en una charla larga el bot
  // nunca veía lo hablado después del mensaje 20.
  const { data: mensajesDesc } = await supabase.from("rodi_mensajes").select("direccion, texto").eq("conversacion_id", conversacion.id).order("created_at", { ascending: false }).limit(20);
  const mensajesPrevios = mensajesDesc ? [...mensajesDesc].reverse() : mensajesDesc;
  const historial = (mensajesPrevios ?? []).map((m) => ({ role: (m.direccion === "in" ? "user" : "assistant") as "user" | "assistant", content: m.texto }));

  const result = await generarRespuestaAgenteV2(historial, "panel-v2/rodi", "Rodi", conversacion.vehiculo_id ?? null);

  if (!result.ok) {
    registrarError("api/panel/rodi/mensaje:agente", result.error, { conversacionId: conversacion.id });
    return NextResponse.json({ replies: ["¡Hola! Gracias por escribirnos a Pfaffen Autos. En breve te contacta uno de nuestros asesores. 🚗"], handoff: false });
  }

  const { reply, handoff, pausar_sin_notificar, calificacion, resumen_handoff, datos_detectados } = result.data;
  const { pedidoStock, vehiculoFocoId } = result;
  const partes = dividirRespuestaEnMensajes(reply);

  for (const parte of partes) {
    await supabase.from("rodi_mensajes").insert({ conversacion_id: conversacion.id, direccion: "out", texto: parte, ai_generado: true });
  }
  const patchCalificacion: Record<string, unknown> = { calificacion };
  if (vehiculoFocoId) patchCalificacion.vehiculo_id = vehiculoFocoId;
  await supabase.from("rodi_conversaciones").update(patchCalificacion).eq("id", conversacion.id);

  // Nombre/email/teléfono que el cliente vaya dando durante la charla se
  // guardan apenas se detectan, sin esperar al handoff — así quedan aunque
  // la charla se corte antes de derivar a un vendedor (antes solo se
  // guardaban si venían en el body inicial del widget, nunca lo que la IA
  // extraía del texto de la conversación).
  if (datos_detectados?.nombre || datos_detectados?.email || datos_detectados?.telefono || datos_detectados?.cuil) {
    const patch: Record<string, unknown> = {};
    if (datos_detectados.nombre && !conversacion.nombre_contacto) patch.nombre_contacto = datos_detectados.nombre;
    if (datos_detectados.email && !conversacion.email_contacto) patch.email_contacto = datos_detectados.email;
    if (datos_detectados.telefono && !conversacion.telefono_contacto) patch.telefono_contacto = datos_detectados.telefono;
    if (datos_detectados.cuil) patch.cuil = datos_detectados.cuil;
    if (Object.keys(patch).length > 0) {
      const { error: errorPatch } = await supabase.from("rodi_conversaciones").update(patch).eq("id", conversacion.id);
      if (errorPatch) registrarError("api/panel/rodi/mensaje:patch-contacto", errorPatch, { conversacionId: conversacion.id });
    }
  }

  // Sin stock que coincida: mismo criterio que WhatsApp -- registrar el
  // pedido con lo que se sabe, para avisar apenas entre algo que coincida.
  if (pedidoStock?.marca) {
    const telefonoOEmail = datos_detectados?.telefono || conversacion.telefono_contacto || datos_detectados?.email || conversacion.email_contacto;
    if (telefonoOEmail) {
      const { data: convVendedor } = await supabase.from("rodi_conversaciones").select("vendedor_id").eq("id", conversacion.id).single();
      // "nombre_cliente" es NOT NULL en "pedidos" -- fallback para no perder
      // el pedido si todavía no tenemos el nombre. "marca" también es NOT
      // NULL, pero esa la exige el prompt antes de completar pedido_stock
      // (ver regla SIN STOCK QUE COINCIDA) -- no se rellena con un fallback
      // acá porque un pedido con marca inventada no sirve para nada.
      const { error: errorPedido } = await supabase.from("pedidos").insert({
        telefono: datos_detectados?.telefono || conversacion.telefono_contacto || null,
        nombre_cliente: datos_detectados?.nombre || conversacion.nombre_contacto || "Visitante de Rodi",
        marca: pedidoStock.marca, modelo: pedidoStock.modelo,
        presupuesto_max: pedidoStock.presupuesto_max, moneda: pedidoStock.moneda || "ARS",
        puertas: pedidoStock.puertas,
        vendedor_id: convVendedor?.vendedor_id ?? null,
        // "pedidos.origen" tiene un check constraint que solo permite
        // whatsapp/web/manual/instagram -- "Rodi" (el nombre del bot del
        // sitio) no es un valor válido, rompía el insert. Rodi ES el chat de
        // la web, así que el origen real es "web".
        origen: "web", tipo: "avisame", estado: "activo",
      });
      if (errorPedido) registrarError("api/panel/rodi/mensaje:crear-pedido", errorPedido);
    }
  }
  if (handoff) {
    // CLIENTE OFENSIVO -- mismo criterio que WhatsApp: se pausa, pero no se
    // asigna vendedor ni se notifica a nadie, se enfría sola. handoff_reason
    // distinto para que el trigger de la base (trg_rodi_handoff, notifica en
    // CUALQUIER handoff normal) lo pueda excluir -- ver migración
    // sql_lookup_trigger_rodi_handoff.sql.
    await supabase.from("rodi_conversaciones").update({
      handoff_at: new Date().toISOString(), handoff_reason: pausar_sin_notificar ? "cliente_ofensivo" : "cliente_pidio_humano", ai_habilitada: false, ai_pausada_en: new Date().toISOString(),
      handoff_resumen: resumen_handoff || null,
    }).eq("id", conversacion.id);

    if (pausar_sin_notificar) return NextResponse.json({ replies: partes, handoff });

    const linkNoti = `/panel/rodi?conversacion=${conversacion.id}`;
    const mensajeNoti = resumen_handoff || "Cliente de Rodi ofrece su auto";
    let vendedorAsignado: string | null = conversacion.vendedor_id ?? null;

    // Venta/consignación/permuta: mismo criterio que WhatsApp -- si todavía
    // no hay vendedor, asignar por ronda de la sucursal elegida en vez de
    // avisar en bloque a todos los encargados sin ningún criterio.
    let sucursalElegida: { id: string; nombre: string } | null = null;
    if (datos_detectados?.zona) {
      const { data } = await supabase.from("sucursales").select("id, nombre").eq("slug", datos_detectados.zona).maybeSingle();
      sucursalElegida = data;
    }
    if (!vendedorAsignado && sucursalElegida) {
      const { data: nuevoVendedorId } = await supabase.rpc("asignar_vendedor_ronda_rodi_por_sucursal", { p_sucursal_id: sucursalElegida.id });
      if (nuevoVendedorId) {
        vendedorAsignado = nuevoVendedorId;
        await supabase.from("rodi_conversaciones").update({ vendedor_id: nuevoVendedorId, estado_lead: "asignado" }).eq("id", conversacion.id);
      }
    }

    // Ojo: el handoff "normal" (compra) ya lo notifica trg_rodi_handoff en
    // la base -- acá solo se manda aviso de más cuando SÍ hay zona (venta/
    // consignación/permuta), que es un caso nuevo que ese trigger no conoce.
    if (sucursalElegida) {
      if (vendedorAsignado) {
        notificarPersona(supabase, vendedorAsignado, "rodi_venta_zona", mensajeNoti, linkNoti).catch((err) => console.error("[rodi] error notificando handoff:", err));
      } else {
        notificarEncargados(supabase, mensajeNoti, linkNoti, "rodi_venta_zona", sucursalElegida.id, "alta").catch((err) => console.error("[rodi] error notificando zona:", err));
      }
    }

    // Día/horario confirmado: agenda visita real.
    if (datos_detectados?.dia_visita && datos_detectados?.horario_visita) {
      const nombreCliente = datos_detectados?.nombre || conversacion.nombre_contacto || "Visitante de Rodi";
      const telefonoCliente = datos_detectados?.telefono || conversacion.telefono_contacto || "sin dato";
      const { error: errorVisita } = await supabase.from("visitas").insert({
        vehiculo_marca: datos_detectados?.vehiculo_propio?.marca || null,
        vehiculo_modelo: datos_detectados?.vehiculo_propio?.modelo || null,
        nombre_cliente: nombreCliente,
        telefono_cliente: telefonoCliente,
        fecha_visita: resolverFechaVisita(datos_detectados.dia_visita),
        horario_visita: datos_detectados.horario_visita,
        sucursal: sucursalElegida?.nombre || "Sin especificar",
        estado: "Pendiente",
        vendedor_id: vendedorAsignado,
      });
      if (errorVisita) registrarError("api/panel/rodi/mensaje:crear-visita", errorVisita);
    }
  }

  return NextResponse.json({ replies: partes, handoff });
}
