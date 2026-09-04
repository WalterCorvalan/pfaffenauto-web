import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase2/server";
import { chatJsonV2, isAiConfiguredV2 } from "@/lib/ai/indexV2";

const RespuestaSchema = z.object({
  reply: z.string(),
  link: z.string().nullable(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { data: perfil } = await supabase.from("perfiles").select("roles").eq("id", user.id).single();
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
  ] = await Promise.all([
    supabase.from("ventas").select("precio_venta, moneda_venta, estado, vehiculo_marca, vehiculo_modelo").gte("fecha_cierre", inicioMes).lte("fecha_cierre", finMes),
    supabase.from("vehiculos").select("estado"),
    supabase.from("clientes").select("id", { count: "exact", head: true }).eq("pipeline_stage", "sin_contactar"),
    supabase.from("comisiones").select("estado, monto, moneda").eq("estado", "pendiente"),
    supabase.from("infracciones").select("estado").eq("estado", "Pendiente"),
    supabase.from("cotizaciones").select("estado").eq("estado", "pendiente"),
    supabase.from("expedientes").select("archivado").eq("archivado", false),
    supabase.rpc("saldos_totales_por_moneda"),
    supabase.from("vehiculos").select("marca, modelo, created_at").eq("estado", "disponible").lt("created_at", new Date(Date.now() - 90 * 86400000).toISOString()),
  ]);

  const ventasCerradas = (ventasMes || []).filter((v) => v.estado === "cerrada");
  const revenuePorMoneda: Record<string, number> = {};
  ventasCerradas.forEach((v) => { revenuePorMoneda[v.moneda_venta] = (revenuePorMoneda[v.moneda_venta] || 0) + Number(v.precio_venta); });
  const conteoEstadoStock: Record<string, number> = {};
  (stockPorEstado || []).forEach((v) => { conteoEstadoStock[v.estado] = (conteoEstadoStock[v.estado] || 0) + 1; });
  const comisionesPorMoneda: Record<string, number> = {};
  (comisiones || []).forEach((c) => { comisionesPorMoneda[c.moneda] = (comisionesPorMoneda[c.moneda] || 0) + Number(c.monto); });

  const snapshot = {
    hoy: hoy.toISOString().slice(0, 10),
    ventas_del_mes: ventasCerradas.length,
    revenue_del_mes_por_moneda: revenuePorMoneda,
    stock_por_estado: conteoEstadoStock,
    stock_estancado_mas_90_dias: (stockEstancado || []).map((v) => `${v.marca} ${v.modelo}`),
    clientes_sin_contactar: clientesSinContactar ?? 0,
    comisiones_pendientes: { cantidad: (comisiones || []).length, por_moneda: comisionesPorMoneda },
    infracciones_pendientes: (infracciones || []).length,
    cotizaciones_pendientes: (cotizaciones || []).length,
    expedientes_activos: (expedientes || []).length,
    saldos_de_caja: saldos || [],
  };

  const systemMsg = `Sos "el gerente", un asistente que ayuda al dueño/admin de Pfaffen Autos (concesionaria) a entender el estado del negocio.
Respondé SIEMPRE en español rioplatense, corto y directo, basándote ÚNICAMENTE en estos datos reales del CRM (no inventes números):
${JSON.stringify(snapshot, null, 2)}

Reglas:
- Los números de arriba son la única fuente de verdad. Nunca los corrijas ni compares con datos externos (no tenés acceso a internet en esta versión).
- Si preguntan algo que no está en estos datos, decilo con honestidad en vez de inventar.
- Si conviene ir a una sección del panel para actuar, sugerí un link relativo (ej: "/panel-v2/clientes") en el campo "link", si no aplica dejalo en null.
- Devolvé SOLO este JSON: {"reply": "...", "link": "/panel-v2/... o null"}`;

  const historialMsgs = Array.isArray(historial) ? historial.slice(-6).map((m: any) => ({ role: m.role === "assistant" ? "assistant" as const : "user" as const, content: String(m.content || "") })) : [];

  const resultado = await chatJsonV2(RespuestaSchema, [
    { role: "system", content: systemMsg },
    ...historialMsgs,
    { role: "user", content: pregunta },
  ], { origen: "gerente_dashboard" });

  if (!resultado.ok) return NextResponse.json({ error: "No se pudo generar una respuesta. Reintentá." }, { status: 500 });
  return NextResponse.json(resultado.data);
}
