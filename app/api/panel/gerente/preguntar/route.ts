import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { chatJsonV2, isAiConfiguredV2 } from "@/lib/ai/indexV2";
import { registrarError } from "@/lib/panel/logger";
import { fetchPaginado } from "@/lib/panel/fetchPaginado";

// "acciones": hasta 3 botones que llevan a la pantalla donde se actúa (el "link" viejo sigue aceptado por si el modelo lo manda).
const RespuestaSchema = z.object({
  reply: z.string(),
  link: z.string().nullable().optional(),
  acciones: z.array(z.object({ texto: z.string(), link: z.string() })).optional().default([]),
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

  // "Hoy" y el mes en hora de Argentina (UTC-3): el servidor corre en UTC y de noche ya era "mañana" para él.
  const ahoraAR = new Date(Date.now() - 3 * 3600000);
  const hoyStr = ahoraAR.toISOString().slice(0, 10);
  const anioAR = ahoraAR.getUTCFullYear();
  const mesAR = ahoraAR.getUTCMonth();
  const claveMes = (a: number, m: number) => `${a}-${String(m + 1).padStart(2, "0")}`;
  const inicioMes = `${claveMes(anioAR, mesAR)}-01`;
  const finMes = new Date(Date.UTC(anioAR, mesAR + 1, 0)).toISOString().slice(0, 10);
  const mesesAtras = (n: number) => { const d = new Date(Date.UTC(anioAR, mesAR - n, 1)); return claveMes(d.getUTCFullYear(), d.getUTCMonth()); };

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
    fetchPaginado<{ estado: string; marca: string | null; modelo: string | null; anio: number | null; precio_venta: number | null; moneda_venta: string | null; created_at: string }>(() => supabase.from("vehiculos").select("id, estado, marca, modelo, anio, precio_venta, moneda_venta, created_at").order("id")).then((data) => ({ data })),
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
    fetchPaginado<{ vendedor_id: string | null; fecha_cierre: string | null; precio_venta: number | null; moneda_venta: string | null }>(() => supabase.from("ventas").select("id, vendedor_id, fecha_cierre, precio_venta, moneda_venta").eq("estado", "cerrada").order("id")).then((data) => ({ data })),
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
    supabase.from("leads_manuales").select("estado_lead, vendedor_id"),
    supabase.from("taller_ordenes").select("estado"),
    supabase.from("reclamos").select("estado"),
    supabase.from("telefonos_utiles").select("id", { count: "exact", head: true }),
    supabase.from("peritajes_lead").select("estado"),
  ]);

  // ---- Datos extra: evolución, patrimonio, caja, cobros y pagos, stock y rendimiento por vendedor ----
  const [{ data: fotosPatrimonio }, { data: cuentasActivas }, { data: cuotasCobrar }, { data: cuotasPagar }] = await Promise.all([
    supabase.from("patrimonio_fotos").select("fecha, moneda, patrimonio_costo, patrimonio_venta, cuentas, stock_costo, stock_venta, a_cobrar, a_pagar").order("fecha", { ascending: false }).limit(800),
    supabase.from("cuentas").select("id, nombre, moneda").eq("activa", true),
    supabase.from("cuotas_cobrar_clientes").select("monto, monto_cobrado, moneda, vencimiento").eq("cobrada", false),
    supabase.from("cuotas_pagar_agencia").select("monto, moneda, vencimiento").eq("pagada", false),
  ]);
  const saldoPorCuenta = await Promise.all((cuentasActivas || []).map(async (c) => {
    const { data: saldo } = await supabase.rpc("saldo_cuenta", { p_cuenta_id: c.id });
    return { cuenta: c.nombre, moneda: c.moneda, saldo: Number(saldo) || 0 };
  }));

  // Ventas cerradas por mes (últimos 7) con cantidad y facturación por moneda: sirve para "cómo venimos vs el mes pasado".
  const ventasPorMes: Record<string, { cantidad: number; facturacion_por_moneda: Record<string, number> }> = {};
  for (let i = 6; i >= 0; i--) ventasPorMes[mesesAtras(i)] = { cantidad: 0, facturacion_por_moneda: {} };
  (ventasHistoricas || []).forEach((v) => {
    const m = v.fecha_cierre?.slice(0, 7);
    if (!m || !ventasPorMes[m]) return;
    ventasPorMes[m].cantidad += 1;
    const mon = v.moneda_venta || "ARS";
    ventasPorMes[m].facturacion_por_moneda[mon] = (ventasPorMes[m].facturacion_por_moneda[mon] || 0) + Number(v.precio_venta || 0);
  });

  // Patrimonio de la agencia: hoy y diferencia contra ayer / semana / mes / año (una moneda a la vez, nunca mezcladas).
  const restarDiasStr = (dia: string, n: number) => { const d = new Date(`${dia}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
  const restarMesesStr = (dia: string, n: number) => { const d = new Date(`${dia}T12:00:00Z`); const dd = d.getUTCDate(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - n); d.setUTCDate(Math.min(dd, new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate())); return d.toISOString().slice(0, 10); };
  const patrimonio: Record<string, unknown> = {};
  ["ARS", "USD"].forEach((mon) => {
    const fotos = (fotosPatrimonio || []).filter((x) => x.moneda === mon);
    const actual = fotos[0];
    if (!actual) return;
    const contra = (objetivo: string) => {
      const previa = fotos.find((x) => x.fecha <= objetivo && x.fecha < actual.fecha);
      if (!previa) return "sin datos todavía (las fotos diarias empezaron el 3/10/2026)";
      return { fecha_comparada: previa.fecha, dif_a_costo: Math.round(Number(actual.patrimonio_costo) - Number(previa.patrimonio_costo)), dif_a_precio_de_venta: Math.round(Number(actual.patrimonio_venta) - Number(previa.patrimonio_venta)) };
    };
    patrimonio[mon] = {
      foto_del: actual.fecha, a_costo: Math.round(Number(actual.patrimonio_costo)), a_precio_de_venta: Math.round(Number(actual.patrimonio_venta)),
      componentes: { cuentas: Math.round(Number(actual.cuentas)), stock_a_costo: Math.round(Number(actual.stock_costo)), stock_a_precio_de_venta: Math.round(Number(actual.stock_venta)), a_cobrar: Math.round(Number(actual.a_cobrar)), a_pagar: Math.round(Number(actual.a_pagar)) },
      vs_ayer: contra(restarDiasStr(actual.fecha, 1)), vs_semana_anterior: contra(restarDiasStr(actual.fecha, 7)), vs_mes_anterior: contra(restarMesesStr(actual.fecha, 1)), vs_ano_anterior: contra(restarMesesStr(actual.fecha, 12)),
    };
  });

  // Cobros y pagos pendientes por moneda, separando lo vencido.
  const resumenCuotas = (filas: { monto: number; monto_cobrado?: number | null; moneda: string; vencimiento: string }[] | null) => {
    const out: Record<string, { pendiente: number; vencido: number; cantidad: number; cantidad_vencidas: number }> = {};
    (filas || []).forEach((c) => {
      const o = (out[c.moneda] = out[c.moneda] || { pendiente: 0, vencido: 0, cantidad: 0, cantidad_vencidas: 0 });
      const resto = Number(c.monto) - Number(c.monto_cobrado || 0);
      o.pendiente += resto; o.cantidad += 1;
      if (c.vencimiento < hoyStr) { o.vencido += resto; o.cantidad_vencidas += 1; }
    });
    Object.values(out).forEach((o) => { o.pendiente = Math.round(o.pendiente); o.vencido = Math.round(o.vencido); });
    return out;
  };

  // Stock: valor a precio de venta por moneda y los autos más viejos.
  const enStock = (stockPorEstado || []).filter((v) => ["disponible", "reservado", "señado", "en_preparacion"].includes(v.estado));
  const valorStockPorMoneda: Record<string, number> = {};
  enStock.forEach((v) => { const mon = v.moneda_venta || "ARS"; valorStockPorMoneda[mon] = (valorStockPorMoneda[mon] || 0) + Number(v.precio_venta || 0); });
  const stockMasViejo = (stockPorEstado || [])
    .filter((v) => v.estado === "disponible")
    .map((v) => ({ auto: [v.marca, v.modelo, v.anio].filter(Boolean).join(" "), dias_en_stock: Math.floor((Date.now() - new Date(v.created_at).getTime()) / 86400000), precio: v.precio_venta ? `${v.moneda_venta === "USD" ? "USD" : "$"} ${Number(v.precio_venta).toLocaleString("es-AR")}` : "sin precio" }))
    .sort((a, b) => b.dias_en_stock - a.dias_en_stock)
    .slice(0, 12);

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

  // Rendimiento por vendedor: leads recibidos (todos los canales), sin contactar y ventas cerradas. "Cierre" = ventas históricas / leads.
  const leadsPorVendedor: Record<string, { leads: number; sin_contactar: number }> = {};
  [whatsappConversaciones, instagramConversaciones, rodiConversaciones, messengerConversaciones, leadsManuales].forEach((lista) => {
    ((lista || []) as { estado_lead: string | null; vendedor_id: string | null }[]).forEach((c) => {
      const nombre = c.vendedor_id ? (nombrePorVendedorId[c.vendedor_id] || "Sin nombre") : "Sin asignar";
      const o = (leadsPorVendedor[nombre] = leadsPorVendedor[nombre] || { leads: 0, sin_contactar: 0 });
      o.leads += 1;
      if (!c.estado_lead || c.estado_lead === "nuevo") o.sin_contactar += 1;
    });
  });
  const rendimientoVendedores = Object.entries(leadsPorVendedor).map(([nombre, l]) => ({
    vendedor: nombre, leads_recibidos: l.leads, leads_sin_contactar: l.sin_contactar,
    ventas_del_mes: ventasPorVendedor[nombre] || 0, ventas_historicas: ventasHistoricasPorVendedor[nombre] || 0,
    cierre_historico_pct: l.leads > 0 && nombre !== "Sin asignar" ? Math.round(((ventasHistoricasPorVendedor[nombre] || 0) / l.leads) * 100) : null,
  })).sort((a, b) => b.ventas_historicas - a.ventas_historicas);

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
    hoy: hoyStr,
    ventas_por_mes_ultimos_7_meses: ventasPorMes,
    patrimonio_de_la_agencia: patrimonio,
    saldo_por_cuenta: saldoPorCuenta,
    cobros_pendientes_de_clientes_por_moneda: resumenCuotas(cuotasCobrar),
    pagos_pendientes_de_la_agencia_por_moneda: resumenCuotas(cuotasPagar),
    stock_valor_a_precio_de_venta_por_moneda: valorStockPorMoneda,
    stock_disponible_mas_viejo: stockMasViejo,
    rendimiento_por_vendedor: rendimientoVendedores,
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
    visitas_pendientes_proximas: (visitas || []).filter((v) => v.estado === "Pendiente" && v.fecha_visita >= hoyStr).length,
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

  const rutas = [...RUTAS_PANEL_VALIDAS].map((r) => `/panel/${r}`).join(", ");
  const systemMsg = `Sos "el gerente": el asistente de gestión del dueño/admin de Pfaffen Cars (concesionaria de autos 0km y usados). Hablás con el dueño, que es una persona ocupada y no técnica: quiere saber qué pasa en el negocio y qué hacer, sin vueltas.

DATOS REALES DEL CRM (única fuente de verdad, actualizados recién; hoy es ${hoyStr}, hora de Argentina):
${JSON.stringify(snapshot, null, 2)}

CÓMO RESPONDER
- Español rioplatense, tono profesional y directo, como un gerente real informando al dueño. Sin "che", sin emojis, sin relleno ni saludos largos.
- Empezá SIEMPRE por la respuesta directa a lo que preguntó, en la primera oración, con la cifra clave. Después el detalle.
- Si la pregunta es abierta ("qué debería atacar hoy", "cómo venimos"), armá una respuesta con esta forma: una oración de resumen, después hasta 4 puntos ordenados por urgencia/impacto (cada uno con la cifra concreta y por qué importa) y cerrá con una línea "Qué haría yo:" con la acción más importante.
- Formato permitido: **negrita** para cifras o nombres clave y listas con guiones ("- "). Nada de tablas, títulos ni código. Respuestas cortas: lo justo para decidir, nunca un informe largo.

REGLAS DE DATOS
- Nunca inventes ni redondees a la fuerza: usá los números tal cual están. Si una cifra no está en los datos, decí claramente que no la tenés en vez de estimarla.
- Pesos (ARS, "$") y dólares (USD) NUNCA se suman ni se mezclan ni se convierten: informá cada moneda por separado, siempre con su símbolo/moneda. Si hay dos monedas, nombrá las dos.
- Para comparar (mes anterior, ayer, semana, año) usá "ventas_por_mes_ultimos_7_meses" y "patrimonio_de_la_agencia". Si dice "sin datos todavía", decilo: las comparaciones del patrimonio recién empiezan a acumularse desde el 3/10/2026. Al hablar de variación, indicá si subió, bajó o quedó igual y cuánto.
- El patrimonio se informa de dos formas: "a costo" y "a precio de venta"; si un auto no tiene precio de compra cargado, el costo queda subestimado (aclaralo si pregunta por patrimonio).
- "rendimiento_por_vendedor": el cierre histórico es ventas históricas sobre leads recibidos; una venta puede no venir de un lead, así que no lo trates como una tasa exacta. Para ver quién necesita ayuda mirá leads sin contactar y ventas, y hablá de la situación, no culpes a nadie.
- Para saber si algo es urgente: cobros vencidos, pagos vencidos, leads sin contactar o sin asignar, autos con muchos días en stock, comisiones pendientes y señas activas.
- Describí SOLO lo que dicen los datos. No supongas ni opines sobre las personas (nada de "tiene tiempo ocioso", "es el único activo", "no rinde"): decí qué pasa ("3 leads asignados sin contactar") y qué conviene hacer. Un vendedor sin ventas históricas puede ser nuevo.
- Tono sereno: sin dramatismo ("el negocio está parado", "pérdida pura"). Un mes con pocas ventas se informa con la cifra y se compara con los meses anteriores.
- Antes de dar un total, revisá que la suma coincida con las partes (por ejemplo, leads por canal). Si no podés confirmar un total con los datos, no lo des.
- Los "clientes sin contactar" son registros del CRM de clientes (muchos importados), distintos de los leads de WhatsApp/Instagram/Rodi: no los mezcles ni los llames leads.
- No tenés acceso a internet ni a precios de mercado: si te lo piden, decí que en esta versión solo trabajás con los datos del CRM.

ACCIONES (botones)
- Si conviene ir a una pantalla para actuar, devolvelas en "acciones": hasta 3 objetos {"texto": "verbo + qué", "link": "/panel/..."} (ej: {"texto": "Ver leads sin contactar", "link": "/panel/leads"}). Solo podés usar estas rutas reales (no inventes otras): ${rutas}. No existe una sección de vendedores (son perfiles): para eso no hay link. Si ninguna aplica, devolvé [].

Devolvé SOLO este JSON, sin texto antes ni después: {"reply": "...", "acciones": [{"texto": "...", "link": "/panel/..."}]}`;
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
  const acciones = (resultado.data.acciones || [])
    .map((a) => ({ texto: a.texto.slice(0, 60), link: linkValido(a.link) }))
    .filter((a): a is { texto: string; link: string } => !!a.link)
    .slice(0, 3);
  const linkViejo = linkValido(resultado.data.link ?? null);
  if (linkViejo && !acciones.some((a) => a.link === linkViejo)) acciones.push({ texto: "Ir ahora", link: linkViejo });
  return NextResponse.json({ reply: resultado.data.reply, acciones });
}
