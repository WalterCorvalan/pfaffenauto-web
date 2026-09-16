import { createClient } from "@supabase/supabase-js";
import { sendTextMessage } from "@/lib/meta/client";
import { decrypt } from "@/lib/crypto";
import { crearAlerta } from "@/lib/panel/alertas";

// Portado de app/api/cron/automatizaciones/route.ts (v1, borrado) -- corría
// contra la base vieja (NEXT_PUBLIC_SUPABASE_URL), que ya no recibe leads ni
// ventas reales. Estas 4 automatizaciones nunca se habían migrado a v2 (a
// diferencia de cuotas por vencer, que sí -- ver avisarCuotasPorVencer en
// seguimientos/route.ts). El dedup ahora es un flag boolean por fila (mismo
// patrón que el resto de panel-v2), no la tabla aparte automatizaciones_wa
// de v1.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

async function tokenWhatsapp(): Promise<{ phoneNumberId: string; token: string } | null> {
  const { data: config } = await supabase.from("whatsapp_configuracion").select("*").eq("id", true).single();
  if (!config?.listo || !config.token_cifrado || !config.token_iv || !config.token_tag || !config.phone_number_id) return null;
  return { phoneNumberId: config.phone_number_id, token: decrypt(config.token_cifrado, config.token_iv, config.token_tag) };
}

// A. Lead caliente sin respuesta interna del vendedor hace 24h+ -- escala
// avisando por la campanita (no le manda nada al cliente).
async function escalarLeadsCalientesSinAtender(): Promise<number> {
  const hace24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: conversaciones } = await supabase
    .from("whatsapp_conversaciones")
    .select("id, vendedor_id, last_inbound_at, aviso_caliente_sin_atender_enviado, whatsapp_contactos(nombre_perfil, telefono)")
    .eq("calificacion", "caliente")
    .lte("last_inbound_at", hace24h)
    .eq("aviso_caliente_sin_atender_enviado", false)
    .is("handoff_at", null);

  let avisados = 0;
  for (const c of conversaciones || []) {
    const contacto = c.whatsapp_contactos as any;
    const nombreLead = contacto?.nombre_perfil || contacto?.telefono || "un lead";
    const mensaje = `${nombreLead} está calificado como caliente y hace 24hs+ que nadie le responde.`;
    const link = `/panel/whatsapp?tab=leads&lead=${c.id}&origen=whatsapp`;
    if (c.vendedor_id) {
      await crearAlerta(supabase, c.vendedor_id, mensaje, { link, tipo: "lead_caliente_sin_atender", prioridad: "alta", categoriaNotif: "leads", modulo: "leads" });
    } else {
      const { data: encargados } = await supabase.from("perfiles").select("id").or("roles.cs.{admin},roles.cs.{encargado}").eq("activo", true);
      for (const e of encargados || []) {
        await crearAlerta(supabase, e.id, mensaje, { link, tipo: "lead_caliente_sin_atender", prioridad: "alta", categoriaNotif: "leads", modulo: "leads" });
      }
    }
    await supabase.from("whatsapp_conversaciones").update({ aviso_caliente_sin_atender_enviado: true }).eq("id", c.id);
    avisados++;
  }
  return avisados;
}

// B. Agradecimiento por WhatsApp después de una venta cerrada (ventana de
// 1-3hs para que el cron lo agarre una sola vez, sin mandarlo al instante).
async function agradecerVentasRecientes(): Promise<number> {
  const wa = await tokenWhatsapp();
  if (!wa) return 0;

  const hace1h = new Date(Date.now() - 1 * 3600 * 1000).toISOString();
  const hace3h = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
  const { data: ventas } = await supabase
    .from("ventas")
    .select("id, comprador_nombre, comprador_telefono, comprador_telefono_celular, vehiculo_marca, vehiculo_modelo")
    .eq("estado", "cerrada")
    .eq("aviso_agradecimiento_enviado", false)
    .lte("created_at", hace1h)
    .gte("created_at", hace3h);

  let enviados = 0;
  for (const v of ventas || []) {
    const telefono = v.comprador_telefono_celular || v.comprador_telefono;
    if (!telefono) continue;
    const texto = `¡Hola ${v.comprador_nombre || ""}! Desde Pfaffen Autos queríamos agradecerte por tu compra${v.vehiculo_marca ? ` del ${v.vehiculo_marca} ${v.vehiculo_modelo || ""}`.trim() : ""} 🚗. Cualquier consulta sobre la documentación o el service, estamos para ayudarte.`;
    try {
      await sendTextMessage(wa.phoneNumberId, wa.token, telefono, texto);
      await supabase.from("ventas").update({ aviso_agradecimiento_enviado: true }).eq("id", v.id);
      enviados++;
    } catch (err) {
      console.error("[cron/automatizaciones] error agradeciendo venta", v.id, err);
    }
  }
  return enviados;
}

// C. A los 30-45 min de nuestro último mensaje, si el cliente no volvió a
// escribir, un empujoncito suave preguntando si quiere más info.
async function nudgeSinRespuesta(): Promise<number> {
  const wa = await tokenWhatsapp();
  if (!wa) return 0;

  const hace30min = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const hace45min = new Date(Date.now() - 45 * 60 * 1000).toISOString();
  const { data: conversaciones } = await supabase
    .from("whatsapp_conversaciones")
    .select("id, last_message_at, last_inbound_at, aviso_nudge_enviado, whatsapp_contactos(telefono)")
    .lte("last_message_at", hace30min)
    .gte("last_message_at", hace45min)
    .eq("aviso_nudge_enviado", false)
    .is("handoff_at", null);

  let enviados = 0;
  for (const c of conversaciones || []) {
    // Si el último mensaje fue del cliente (last_inbound_at === last_message_at), ya nos toca a nosotros, no hace falta nudge.
    if (c.last_inbound_at === c.last_message_at) continue;
    const telefono = (c.whatsapp_contactos as any)?.telefono;
    if (!telefono) continue;
    const texto = "¿Te gustaría que te pase más información, fotos o el precio actualizado? Cualquier cosa, estamos por acá.";
    try {
      const resultado = await sendTextMessage(wa.phoneNumberId, wa.token, telefono, texto);
      await supabase.from("whatsapp_mensajes").insert({ conversacion_id: c.id, direccion: "out", tipo: "text", texto, status: "sent", ai_generado: true, wa_message_id: resultado.messages?.[0]?.id });
      await supabase.from("whatsapp_conversaciones").update({ aviso_nudge_enviado: true, last_message_at: new Date().toISOString() }).eq("id", c.id);
      enviados++;
    } catch (err) {
      console.error("[cron/automatizaciones] error mandando nudge", c.id, err);
    }
  }
  return enviados;
}

// D. Documentación pendiente hace 5+ días en un expediente -- avisa a
// gestoría/encargados que hay que ir a buscar/reclamar ese papel.
async function alertarDocumentacionPendiente(): Promise<number> {
  const hace5dias = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
  const { data: expedientes } = await supabase
    .from("expedientes")
    .select("id, titulo, gestor_asignado_id, venta:ventas(comprador_nombre, vehiculo_marca, vehiculo_modelo)")
    .neq("estado", "cerrado")
    .eq("aviso_doc_pendiente_enviado", false)
    .lte("created_at", hace5dias);

  let avisados = 0;
  for (const e of expedientes || []) {
    const { data: pendientes } = await supabase.from("expediente_checklist").select("nombre").eq("expediente_id", e.id).eq("completado", false);
    if (!pendientes || pendientes.length === 0) continue;

    const venta = e.venta as any;
    const listaDocs = pendientes.map((d) => d.nombre).join(", ");
    const mensaje = `${e.titulo || `${venta?.vehiculo_marca || ""} ${venta?.vehiculo_modelo || ""}`.trim()} (${venta?.comprador_nombre || "sin comprador"}) tiene documentación pendiente hace 5+ días: ${listaDocs}.`;
    const link = `/panel/expedientes?expediente=${e.id}`;
    if (e.gestor_asignado_id) {
      await crearAlerta(supabase, e.gestor_asignado_id, mensaje, { link, tipo: "doc_pendiente_expediente", prioridad: "media", categoriaNotif: "expedientes", modulo: "expedientes" });
    } else {
      const { data: encargados } = await supabase.from("perfiles").select("id").or("roles.cs.{admin},roles.cs.{encargado},roles.cs.{gestoria}").eq("activo", true);
      for (const d of encargados || []) {
        await crearAlerta(supabase, d.id, mensaje, { link, tipo: "doc_pendiente_expediente", prioridad: "media", categoriaNotif: "expedientes", modulo: "expedientes" });
      }
    }
    await supabase.from("expedientes").update({ aviso_doc_pendiente_enviado: true }).eq("id", e.id);
    avisados++;
  }
  return avisados;
}

// E. Handoff viejo sin actividad 30+ días -- reactiva a Rodi para que la
// conversación no quede muda para siempre si el vendedor la dejó sin cerrar.
// No borra nada del historial, solo vuelve a habilitar la IA.
async function reactivarHandoffViejo(): Promise<number> {
  const hace30dias = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const { data: conversaciones } = await supabase
    .from("whatsapp_conversaciones")
    .select("id")
    .eq("ai_habilitada", false)
    .not("handoff_at", "is", null)
    .lte("last_message_at", hace30dias);

  let reactivadas = 0;
  for (const c of conversaciones || []) {
    await supabase
      .from("whatsapp_conversaciones")
      .update({ ai_habilitada: true, handoff_at: null, handoff_reason: null, handoff_resumen: null })
      .eq("id", c.id);
    reactivadas++;
  }
  return reactivadas;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [leadsCalientes, agradecimientos, nudges, docsPendientes, handoffReactivados] = await Promise.all([
    escalarLeadsCalientesSinAtender(),
    agradecerVentasRecientes(),
    nudgeSinRespuesta(),
    alertarDocumentacionPendiente(),
    reactivarHandoffViejo(),
  ]);

  return Response.json({ ok: true, leadsCalientes, agradecimientos, nudges, docsPendientes, handoffReactivados });
}
