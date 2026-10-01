import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { chatJsonV2, isAiConfiguredV2 } from "@/lib/ai/indexV2";
import { registrarError } from "@/lib/panel/logger";

const RespuestaSchema = z.object({
  reply: z.string(),
  link: z.string().nullable(),
});

// Rutas reales de /panel -- el modelo tiende a inventar secciones que
// "deberían" existir (ej: "/panel/vendedores", que no existe: los
// vendedores son perfiles con un rol, no tienen sección propia). Se valida
// el link sugerido contra esta lista en vez de confiar en lo que devuelva.
const RUTAS_PANEL_VALIDAS = new Set([
  "alertas", "autorizaciones", "calendario", "clientes", "cobros", "comisiones", "configuracion",
  "consignaciones", "cotizaciones", "dormidos", "errores", "expedientes", "financiaciones", "finanzas",
  "gestoria", "infracciones", "instagram", "leads", "liquidaciones", "logs", "marketing", "mensajes",
  "messenger", "mi-espacio", "mi-perfil", "mis-ventas", "nps", "papelera", "pedidos", "peritajes",
  "postulaciones", "postventa", "presupuestos", "reclamos", "recontactos", "reportes", "rodi", "senas",
  "stock", "sueldos", "taller", "tareas", "telefonos", "tesoreria", "ventas", "visitas", "whatsapp",
]);

function linkValido(link: string | null): string | null {
  if (!link) return null;
  const match = link.match(/^\/panel\/([a-z-]+)/);
  if (!match || !RUTAS_PANEL_VALIDAS.has(match[1])) return null;
  return link;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { data: perfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).maybeSingle();
  if (!perfil?.roles?.includes("admin")) return NextResponse.json({ error: "Solo administradores." }, { status: 403 });

  if (!isAiConfiguredV2()) return NextResponse.json({ error: "No hay ninguna IA configurada en el servidor." }, { status: 400 });

  const { pregunta, historial } = await request.json();
  if (!pregunta || typeof pregunta !== "string") return NextResponse.json({ error: "Falta la pregunta." }, { status: 400 });

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [
    { data: ventasMes },
    { data: stockPorEstado },
    { count: clientesSinContactar },
    { data: comisiones },
    { data: infracciones },
    { data: cotizaciones },
    { data: expedientes },
    { data: saldos },
    { data: stockEstancado },
    { data: vendedores },
    { data: ventasHistoricas },
    { data: senas },
    { data: visitas },
    { data: consignaciones },
    { data: postventaRecordatorios },
    { count: alertasSinLeer },
    { data: leadsFinanciacion },
    { data: whatsappConversaciones },
    { data: instagramConversaciones },
    { data: liquidacionesSueldo },
    { data: pedidos },
    { data: rodiConversaciones },
    { data: messengerConversaciones },
    { data: leadsManuales },
    { data: tallerOrdenes },
    { data: reclamos },
    { count: telefonosUtiles },
    { data: peritajesLead },
  ] = await Promise.all([
    supabase.from("ventas").select("precio_venta, moneda_venta, estado, vehiculo_marca, vehiculo_modelo, vendedor_id").gte("fecha_cierre", inicioMes).lte("fecha_cierre", finMes),
    supabase.from("vehiculos").select("estado"),
    supabase.from("clientes").select("id", { count: "exact", head: true }).eq("pipeline_stage", "sin_contactar"),
    supabase.from("comisiones").select("estado, monto, moneda").eq("estado", "pendiente"),
    supabase.from("infracciones").select("estado").eq("estado", "Pendiente"),
    supabase.from("cotizaciones").select("estado").eq("estado", "pendiente"),
    supabase.from("expedientes").select("archivado").eq("archivado", false),
    supabase.rpc("saldos_totales_por_moneda"),
    supabase.from("vehiculos").select("marca, modelo, created_at").eq("estado", "disponible").lt("created_at", new Date(Date.now() - 90 * 86400000).toISOString()),
    supabase.from("perfiles").select("id, nombre").eq("activo", true),
    // Pedido explícito: "el gerente" es un chat interno, tiene que poder
    // responder con TODO lo que hay en el sistema, no solo el recorte del
    // mes en curso -- así que además del snapshot mensual se suma el
    // histórico completo de ventas cerradas por vendedor.
    supabase.from("ventas").select("vendedor_id").eq("estado", "cerrada"),
    // Pedido explícito 24/9: "el gerente" tiene que conocer TODOS los
    // módulos del panel, no solo ventas/stock/finanzas -- se suma un
    // resumen liviano (conteos, no filas completas) de cada módulo que
    // faltaba: señas, visitas, consignaciones, postventa/taller, alertas
    // sin leer del admin que pregunta, financiación, conversaciones de
    // WhatsApp/Instagram, sueldos y pedidos.
    supabase.from("senas").select("estado"),
    supabase.from("visitas").select("estado, fecha_visita"),
    supabase.from("consignaciones").select("estado"),
    supabase.from("postventa_recordatorios").select("estado, fecha_vencimiento"),
    supabase.from("alertas").select("id", { count: "exact", head: true }).eq("destinatario_id", user.id).eq("leida", false),
    supabase.from("leads_tasacion").select("estado").eq("tipo", "financiacion"),
    supabase.from("whatsapp_conversaciones").select("estado_lead, vendedor_id, handoff_at, ai_habilitada"),
    supabase.from("instagram_conversaciones").select("estado_lead, vendedor_id, handoff_at, ai_habilitada"),
    supabase.from("liquidaciones_sueldo").select("estado, total_final, moneda_total, mes").eq("mes", `${inicioMes.slice(0, 7)}-01`),
    supabase.from("pedidos").select("estado"),
    // Pedido explícito 1/10: "el gerente" no sabía nada de Rodi (el chat del
    // sitio público, canal propio, no suma a whatsapp/instagram), Messenger
    // (canal nuevo), leads manuales (walk-in), Taller, Reclamos, Teléfonos
    // útiles ni Peritajes de leads -- ninguno se había sumado nunca al
    // snapshot, así que cualquier pregunta sobre esos módulos la contestaba
    // "no tengo ese dato" aunque la info sí estuviera en la base.
    supabase.from("rodi_conversaciones").select("estado_lead, vendedor_id, handoff_at, ai_habilitada"),
    supabase.from("messenger_conversaciones").select("estado_lead, vendedor_id, handoff_at, ai_habilitada"),
    supabase.from("leads_manuales").select("estado_lead"),
    supabase.from("taller_ordenes").select("estado"),
    supabase.from("reclamos").select("estado"),
    supabase.from("telefonos_utiles").select("id", { count: "exact", head: true }),
    supabase.from("peritajes_lead").select("estado"),
  ]);

  const ventasCerradas = (ventasMes || []).filter((v) => v.estado === "cerrada");
  const revenuePorMoneda: Record<string, number> = {};
  ventasCerradas.forEach((v) => { revenuePorMoneda[v.moneda_venta] = (revenuePorMoneda[v.moneda_venta] || 0) + Number(v.precio_venta); });
  const conteoEstadoStock: Record<string, number> = {};
  (stockPorEstado || []).forEach((v) => { conteoEstadoStock[v.estado] = (conteoEstadoStock[v.estado] || 0) + 1; });
  const comisionesPorMoneda: Record<string, number> = {};
  (comisiones || []).forEach((c) => { comisionesPorMoneda[c.moneda] = (comisionesPorMoneda[c.moneda] || 0) + Number(c.monto); });

  // Antes el snapshot solo traía el total de ventas del negocio, sin
  // desglose por vendedor -- una pregunta tan directa como "cuántas ventas
  // lleva Fede" no tenía con qué responderse, y el bot terminaba diciendo
  // "no tengo ese dato" aunque la info sí está en "ventas", solo que nunca
  // se le pasó agrupada por vendedor_id.
  const nombrePorVendedorId: Record<string, string> = {};
  (vendedores || []).forEach((v) => { nombrePorVendedorId[v.id] = v.nombre; });
  const ventasPorVendedor: Record<string, number> = {};
  ventasCerradas.forEach((v: { vendedor_id: string | null }) => {
    const nombre = v.vendedor_id ? (nombrePorVendedorId[v.vendedor_id] || "Sin nombre") : "Sin vendedor asignado";
    ventasPorVendedor[nombre] = (ventasPorVendedor[nombre] || 0) + 1;
  });
  const ventasHistoricasPorVendedor: Record<string, number> = {};
  (ventasHistoricas || []).forEach((v: { vendedor_id: string | null }) => {
    const nombre = v.vendedor_id ? (nombrePorVendedorId[v.vendedor_id] || "Sin nombre") : "Sin vendedor asignado";
    ventasHistoricasPorVendedor[nombre] = (ventasHistoricasPorVendedor[nombre] || 0) + 1;
  });

  const contarPorEstado = (filas: { estado: string | null }[] | null) => {
    const acc: Record<string, number> = {};
    (filas || []).forEach((f) => { const k = f.estado || "sin_estado"; acc[k] = (acc[k] || 0) + 1; });
    return acc;
  };

  type ConversacionCanal = { estado_lead: string | null; vendedor_id: string | null; handoff_at: string | null; ai_habilitada: boolean | null };
  const resumenCanal = (filas: ConversacionCanal[] | null) => ({
    conversaciones_totales: (filas || []).length,
    sin_asignar: (filas || []).filter((c) => !c.vendedor_id).length,
    con_handoff_pendiente: (filas || []).filter((c) => c.handoff_at && !c.ai_habilitada).length,
    por_estado_lead: contarPorEstado((filas || []).map((c) => ({ estado: c.estado_lead }))),
  });

  const liquidacionesPendientes = (liquidacionesSueldo || []).filter((l) => l.estado !== "pagada");
  const totalSueldosPendientesPorMoneda: Record<string, number> = {};
  liquidacionesPendientes.forEach((l) => { totalSueldosPendientesPorMoneda[l.moneda_total] = (totalSueldosPendientesPorMoneda[l.moneda_total] || 0) + Number(l.total_final); });

  const snapshot = {
    hoy: hoy.toISOString().slice(0, 10),
    ventas_del_mes: ventasCerradas.length,
    ventas_del_mes_por_vendedor: ventasPorVendedor,
    ventas_totales_historicas_por_vendedor: ventasHistoricasPorVendedor,
    revenue_del_mes_por_moneda: revenuePorMoneda,
    stock_por_estado: conteoEstadoStock,
    stock_estancado_mas_90_dias: (stockEstancado || []).map((v) => `${v.marca} ${v.modelo}`),
    clientes_sin_contactar: clientesSinContactar ?? 0,
    comisiones_pendientes: { cantidad: (comisiones || []).length, por_moneda: comisionesPorMoneda },
    infracciones_pendientes: (infracciones || []).length,
    cotizaciones_pendientes: (cotizaciones || []).length,
    expedientes_activos: (expedientes || []).length,
    saldos_de_caja: saldos || [],
    senas_por_estado: contarPorEstado(senas),
    visitas_por_estado: contarPorEstado(visitas),
    visitas_pendientes_proximas: (visitas || []).filter((v) => v.estado === "Pendiente" && v.fecha_visita >= hoy.toISOString().slice(0, 10)).length,
    consignaciones_por_estado: contarPorEstado(consignaciones),
    postventa_recordatorios_pendientes: (postventaRecordatorios || []).filter((r) => r.estado === "pendiente").length,
    alertas_sin_leer_del_admin_que_pregunta: alertasSinLeer ?? 0,
    leads_financiacion_por_estado: contarPorEstado(leadsFinanciacion),
    whatsapp: resumenCanal(whatsappConversaciones),
    instagram: resumenCanal(instagramConversaciones),
    rodi: resumenCanal(rodiConversaciones),
    messenger: resumenCanal(messengerConversaciones),
    leads_manuales_por_estado: contarPorEstado((leadsManuales || []).map((l) => ({ estado: l.estado_lead }))),
    sueldos_pendientes_de_pago_del_mes: { cantidad: liquidacionesPendientes.length, por_moneda: totalSueldosPendientesPorMoneda },
    pedidos_por_estado: contarPorEstado(pedidos),
    taller_ordenes_por_etapa: contarPorEstado(tallerOrdenes),
    reclamos_por_estado: contarPorEstado(reclamos),
    telefonos_utiles_cargados: telefonosUtiles ?? 0,
    peritajes_lead_por_estado: contarPorEstado(peritajesLead),
  };

  const systemMsg = `Sos "el gerente", un asistente que ayuda al dueño/admin de Pfaffen Cars (concesionaria) a entender el estado del negocio.
Respondé SIEMPRE en español rioplatense, con un tono profesional y serio — como un gerente real informando al dueño, directo y sin vueltas, sin informalidades ni onda de chat casual (nada de "che", emojis de más, ni comentarios de relleno) — basándote ÚNICAMENTE en estos datos reales del CRM (no inventes números):
${JSON.stringify(snapshot, null, 2)}

Reglas:
- Los números de arriba son la única fuente de verdad. Nunca los corrijas ni compares con datos externos (no tenés acceso a internet en esta versión).
- Si preguntan algo que no está en estos datos, decilo con honestidad en vez de inventar.
- Si conviene ir a una sección del panel para actuar, sugerí un link relativo en el campo "link", pero SOLO usando una de estas secciones reales (no inventes otras): ${[...RUTAS_PANEL_VALIDAS].map((r) => `/panel/${r}`).join(", ")}. No hay una sección de "vendedores" -- los vendedores son perfiles, para eso no hay link. Si ninguna aplica, dejá el campo en null.
- Devolvé SOLO este JSON: {"reply": "...", "link": "/panel/... o null"}`;

  const historialMsgs = Array.isArray(historial) ? historial.slice(-6).map((m: any) => ({ role: m.role === "assistant" ? "assistant" as const : "user" as const, content: String(m.content || "") })) : [];

  const resultado = await chatJsonV2(RespuestaSchema, [
    { role: "system", content: systemMsg },
    ...historialMsgs,
    { role: "user", content: pregunta },
  ], { origen: "gerente_dashboard" });

  if (!resultado.ok) {
    registrarError("api/panel/gerente/preguntar", resultado.error, { userId: user.id });
    return NextResponse.json({ error: "No se pudo generar una respuesta. Reintentá." }, { status: 500 });
  }
  return NextResponse.json({ ...resultado.data, link: linkValido(resultado.data.link) });
}
