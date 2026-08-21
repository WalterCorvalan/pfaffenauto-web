import { createClient } from "@supabase/supabase-js";
import { sendTextMessage, publishInstagramPost } from "@/lib/meta/client";
import { notificarPersona, notificarEncargados } from "@/lib/notificaciones";
import { registrarError } from "@/lib/logger";

// Corre cada 15 min vía pg_cron (ver SQL de configuración). Idempotente: cada
// automatización se registra en `automatizaciones_wa` (tipo, referencia_id
// únicos) antes de disparar, así un mismo evento nunca se manda dos veces
// aunque el cron corra de nuevo.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isWhatsappEnvioConfigurado(): boolean {
  return !!process.env.META_WHATSAPP_TOKEN && !!process.env.META_WHATSAPP_PHONE_NUMBER_ID;
}

async function yaSeEnvio(tipo: string, referenciaId: string): Promise<boolean> {
  const { data } = await supabase
    .from("automatizaciones_wa")
    .select("id")
    .eq("tipo", tipo)
    .eq("referencia_id", referenciaId)
    .maybeSingle();
  return !!data;
}

async function registrarEnvio(tipo: string, referenciaId: string) {
  await supabase.from("automatizaciones_wa").insert({ tipo, referencia_id: referenciaId }).select("id").maybeSingle();
}

async function enviarWA(telefono: string, texto: string) {
  if (!isWhatsappEnvioConfigurado()) return false;
  try {
    await sendTextMessage(process.env.META_WHATSAPP_PHONE_NUMBER_ID!, process.env.META_WHATSAPP_TOKEN!, telefono, texto);
    return true;
  } catch (err) {
    registrarError("api/cron/automatizaciones enviarWA", err);
    return false;
  }
}

// A. Lead caliente sin respuesta interna del vendedor hace 24h+ — escala avisando
// (no le manda nada al cliente, es una notificación interna de la campanita).
async function escalarLeadsCalientesSinAtender() {
  const hace24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: conversaciones } = await supabase
    .from("whatsapp_conversaciones")
    .select("id, vendedor_id, calificacion, last_inbound_at, whatsapp_contactos(nombre_perfil, telefono)")
    .eq("calificacion", "caliente")
    .lte("last_inbound_at", hace24h)
    .is("handoff_at", null);

  for (const c of conversaciones || []) {
    if (await yaSeEnvio("escalado_caliente_24h", c.id)) continue;
    const contacto = c.whatsapp_contactos as any;
    const nombreLead = contacto?.nombre_perfil || contacto?.telefono || "un lead";
    const mensaje = `${nombreLead} está calificado como caliente y hace 24hs+ que nadie le responde.`;
    const link = `/panel/chat?conversacion=${c.id}&canal=whatsapp`;
    if (c.vendedor_id) {
      await notificarPersona(supabase, c.vendedor_id, "lead_caliente_sin_atender", mensaje, link, "chat");
    } else {
      await notificarEncargados(supabase, mensaje, link, "chat", "lead_caliente_sin_atender");
    }
    await registrarEnvio("escalado_caliente_24h", c.id);
  }
}

// B. Agradecimiento por WhatsApp después de una venta confirmada (1-3hs después,
// ventana para que el cron lo agarre una sola vez sin mandarlo al instante).
async function agradecerVentasRecientes() {
  const hace1h = new Date(Date.now() - 1 * 3600 * 1000).toISOString();
  const hace3h = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
  const { data: ventas } = await supabase
    .from("boletos_venta")
    .select("id, nombre, telefono_celular, marca, modelo")
    .lte("created_at", hace1h)
    .gte("created_at", hace3h)
    .not("telefono_celular", "is", null);

  for (const v of ventas || []) {
    if (await yaSeEnvio("agradecimiento_venta", v.id)) continue;
    const texto = `¡Hola ${v.nombre || ""}! Desde Pfaffen Autos queríamos agradecerte por tu compra${v.marca ? ` del ${v.marca} ${v.modelo}` : ""} 🚗. Cualquier consulta sobre la documentación o el service, estamos para ayudarte.`;
    const enviado = await enviarWA(v.telefono_celular!, texto);
    if (enviado) await registrarEnvio("agradecimiento_venta", v.id);
  }
}

// C. A los 30-45 min de nuestro último mensaje, si el cliente no volvió a
// escribir, un empujoncito suave preguntando si quiere más info.
async function nudgeSinRespuesta() {
  const hace30min = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const hace45min = new Date(Date.now() - 45 * 60 * 1000).toISOString();
  const { data: conversaciones } = await supabase
    .from("whatsapp_conversaciones")
    .select("id, calificacion, last_message_at, last_inbound_at, whatsapp_contactos(telefono, nombre_perfil)")
    .lte("last_message_at", hace30min)
    .gte("last_message_at", hace45min)
    .is("handoff_at", null);

  for (const c of conversaciones || []) {
    // Si el último mensaje fue del cliente (last_inbound_at === last_message_at), ya nos toca a nosotros, no hace falta nudge.
    if (c.last_inbound_at === c.last_message_at) continue;
    if (await yaSeEnvio("nudge_30min", c.id)) continue;
    const contacto = c.whatsapp_contactos as any;
    if (!contacto?.telefono) continue;
    const texto = "¿Te gustaría que te pase más información, fotos o el precio actualizado? Cualquier cosa, estamos por acá.";
    const enviado = await enviarWA(contacto.telefono, texto);
    if (enviado) await registrarEnvio("nudge_30min", c.id);
  }
}

// D. Documentación pendiente hace 5+ días en una venta ya cerrada — avisa a los
// encargados que hay que ir a buscar/reclamar ese papel (cédula, VTV, etc).
async function alertarDocumentacionPendiente() {
  const hace5dias = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split("T")[0];
  const { data: boletosViejos } = await supabase
    .from("boletos_venta")
    .select("id, numero, apellido, nombre, fecha")
    .lte("fecha", hace5dias);

  for (const b of boletosViejos || []) {
    const { data: pendientes } = await supabase
      .from("documentacion_ventas")
      .select("tipo_documento")
      .eq("venta_id", b.id)
      .eq("estado", "Pendiente");
    if (!pendientes || pendientes.length === 0) continue;

    if (await yaSeEnvio("doc_pendiente_venta", b.id)) continue;
    const listaDocs = pendientes.map((d) => d.tipo_documento).join(", ");
    const mensaje = `Venta N° ${b.numero} (${b.apellido}, ${b.nombre}) tiene documentación pendiente hace 5+ días: ${listaDocs}.`;
    await notificarEncargados(supabase, mensaje, `/panel/ventas/seguimiento/${b.id}`, "boletos", "doc_pendiente_venta");
    await registrarEnvio("doc_pendiente_venta", b.id);
  }
}

// E. Cuota de financiación por vencer en los próximos 3 días — recordatorio
// interno a encargados (no le mandamos nada al cliente automáticamente, es
// un aviso para que lo gestionen/cobren a tiempo).
async function alertarCuotasPorVencer() {
  const hoy = new Date().toISOString().split("T")[0];
  const en3dias = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split("T")[0];
  const { data: financiaciones } = await supabase
    .from("financiaciones")
    .select("id, entidad, monto, fecha_vencimiento, venta_id")
    .eq("estado", "Pendiente")
    .gte("fecha_vencimiento", hoy)
    .lte("fecha_vencimiento", en3dias);

  for (const f of financiaciones || []) {
    if (await yaSeEnvio("cuota_por_vencer", f.id)) continue;
    const mensaje = `Cuota de financiación (${f.entidad || "sin entidad"}) por $${Number(f.monto).toLocaleString("es-AR")} vence el ${new Date(`${f.fecha_vencimiento}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" })}.`;
    await notificarEncargados(supabase, mensaje, "/panel/ventas/financiaciones", "boletos", "cuota_por_vencer");
    await registrarEnvio("cuota_por_vencer", f.id);
  }
}

// F. Resumen semanal de stock nuevo a Instagram — lunes 9am (12hs UTC,
// Argentina UTC-3). Ventana de una hora entera porque el cron corre cada 15
// min y necesitamos que entre en al menos una corrida sin depender del minuto
// exacto; el registro en automatizaciones_wa evita que se repita esa misma
// semana aunque varias corridas caigan dentro de la ventana.
async function publicarResumenStockSemanal() {
  const ahora = new Date();
  if (ahora.getUTCDay() !== 1 || ahora.getUTCHours() !== 12) return;

  const inicioSemana = `${ahora.getUTCFullYear()}-W${String(Math.ceil(ahora.getUTCDate() / 7)).padStart(2, "0")}-${ahora.getUTCMonth() + 1}`;
  if (await yaSeEnvio("resumen_stock_semanal", inicioSemana)) return;

  if (!process.env.META_INSTAGRAM_TOKEN || !process.env.META_INSTAGRAM_USER_ID) return;

  const hace7dias = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: autosNuevos } = await supabase
    .from("vehiculos")
    .select("marca, modelo, anio, multimedia_vehiculos ( url_archivo )")
    .eq("estado", "Disponible")
    .gte("created_at", hace7dias)
    .order("created_at", { ascending: false });

  if (!autosNuevos || autosNuevos.length === 0) return;

  const fotoUrl = (autosNuevos[0].multimedia_vehiculos as any)?.[0]?.url_archivo;
  if (!fotoUrl) return;

  const listado = autosNuevos.map((v: any) => `${v.marca} ${v.modelo} ${v.anio || ""}`.trim()).join("\n");
  const caption = [
    `🚗 ${autosNuevos.length} ${autosNuevos.length === 1 ? "auto nuevo" : "autos nuevos"} esta semana en Pfaffen Autos`,
    listado,
    "Consultanos por el que te interesa 👇",
  ].join("\n\n");

  try {
    await publishInstagramPost(process.env.META_INSTAGRAM_USER_ID, process.env.META_INSTAGRAM_TOKEN, fotoUrl, caption);
    await registrarEnvio("resumen_stock_semanal", inicioSemana);
  } catch (err) {
    registrarError("api/cron publicarResumenStockSemanal", err);
  }
}

// Housekeeping de logs_errores: el cron corre cada 15 min, pero solo hace
// falta purgar una vez por día — se limita a la ventana 03:00-03:14 UTC para
// no pegarle un DELETE a la tabla en cada corrida.
async function limpiarLogsAntiguos() {
  if (new Date().getUTCHours() !== 3) return;
  const hace30dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("logs_errores").delete().lt("created_at", hace30dias);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  await Promise.all([
    escalarLeadsCalientesSinAtender().catch((err) => registrarError("api/cron escalarLeadsCalientesSinAtender", err)),
    agradecerVentasRecientes().catch((err) => registrarError("api/cron agradecerVentasRecientes", err)),
    nudgeSinRespuesta().catch((err) => registrarError("api/cron nudgeSinRespuesta", err)),
    alertarDocumentacionPendiente().catch((err) => registrarError("api/cron alertarDocumentacionPendiente", err)),
    alertarCuotasPorVencer().catch((err) => registrarError("api/cron alertarCuotasPorVencer", err)),
    publicarResumenStockSemanal().catch((err) => registrarError("api/cron publicarResumenStockSemanal", err)),
    limpiarLogsAntiguos().catch((err) => registrarError("api/cron limpiarLogsAntiguos", err)),
  ]);

  return Response.json({ ok: true, ranAt: new Date().toISOString() });
}
