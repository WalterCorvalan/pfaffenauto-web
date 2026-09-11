import { createClient } from "@supabase/supabase-js";
import { crearAlerta } from "@/lib/panel/alertas";

// Corre 1 vez por día vía pg_cron. Cubre 4 seguimientos que se cargan en el
// panel pero hasta ahora no avisaban solos (mismo patrón que Mi Espacio):
//   1) Consignaciones sin contacto reciente -- se enfriaban sin que nadie
//      se enterara (el propio módulo lo advierte: "así no se te enfría un
//      auto por falta de seguimiento", pero nada lo empujaba).
//   2) Expedientes a un día de pasar el umbral de "atrasado".
//   3) Recordatorios de postventa vencidos (VTV, seguro, service, etc. --
//      TIPOS de app/panel/postventa/PostventaClient.tsx).
//   4) Compras de postventa sin ningún recordatorio de tipo "service"
//      cargado todavía, pasados unos días de la venta.
//   5) Reclamos estancados (sin movimiento hace +3 días, mismo umbral que
//      ya usa ReclamosClient.tsx para el contador de la UI).
//   6) Tareas de leads vencidas.
//   7) Cuotas (a cobrar de clientes, a pagar de la agencia) por vencer.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

const DIAS_URGENTE_SIN_CONTACTO = 10;
const DIAS_MARGEN_SERVICE_SIN_OFRECER = 3;
const ESTADOS_CONSIGNACION_ACTIVOS = ["pendiente_contacto", "contactado", "agendado", "ingreso_local", "publicado"];

function fechaHoyIso(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
}
function fechaHaceDiasIso(dias: number): string {
  const d = new Date(`${fechaHoyIso()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

async function avisarConsignacionesSinContacto(): Promise<number> {
  const limite = fechaHaceDiasIso(DIAS_URGENTE_SIN_CONTACTO);
  const { data: consignaciones } = await supabase
    .from("consignaciones")
    .select("id, vehiculo_descripcion, vendedor_id, ultimo_contacto, created_at, estado, aviso_sin_contacto_fecha")
    .in("estado", ESTADOS_CONSIGNACION_ACTIVOS);

  let avisados = 0;
  for (const c of consignaciones ?? []) {
    if (!c.vendedor_id) continue;
    const ultimoContacto = c.ultimo_contacto || c.created_at?.slice(0, 10);
    if (!ultimoContacto || ultimoContacto > limite) continue; // todavía dentro del margen
    if (c.aviso_sin_contacto_fecha === ultimoContacto) continue; // ya se avisó para este mismo último contacto

    const dias = Math.round((Date.now() - new Date(`${ultimoContacto}T12:00:00Z`).getTime()) / 86400000);
    await crearAlerta(supabase, c.vendedor_id, `Re-contacto urgente: ${c.vehiculo_descripcion || "consignación"}`, {
      mensaje: `${dias} días sin contacto.`,
      link: `/panel/consignaciones?consignacion=${c.id}`,
      tipo: "consignacion_sin_contacto",
      prioridad: "alta",
      categoriaNotif: "consignacion",
    });
    await supabase.from("consignaciones").update({ aviso_sin_contacto_fecha: ultimoContacto }).eq("id", c.id);
    avisados++;
  }
  return avisados;
}

async function avisarExpedientesPorVencer(): Promise<number> {
  const { data: config } = await supabase.from("configuracion_empresa").select("resumen_diario_dias_expediente_atrasado").eq("id", true).maybeSingle();
  const umbral = config?.resumen_diario_dias_expediente_atrasado ?? 15;

  const { data: expedientes } = await supabase
    .from("expedientes")
    .select("id, titulo, created_at, estado, gestor_asignado_id, aviso_por_vencer_enviado")
    .neq("estado", "cerrado")
    .eq("aviso_por_vencer_enviado", false);

  let avisados = 0;
  for (const e of expedientes ?? []) {
    if (!e.gestor_asignado_id) continue;
    const diasTranscurridos = Math.floor((Date.now() - new Date(e.created_at).getTime()) / 86400000);
    if (diasTranscurridos < umbral - 1) continue; // todavía no está a 1 día del límite
    const quedan = Math.max(0, umbral - diasTranscurridos);

    await crearAlerta(supabase, e.gestor_asignado_id, `Expediente próximo a vencer — ${e.titulo || "expediente"}`, {
      mensaje: `Lleva ${diasTranscurridos} días — quedan ${quedan} día${quedan === 1 ? "" : "s"} para el límite.`,
      link: `/panel/expedientes?expediente=${e.id}`,
      tipo: "expediente_por_vencer",
      prioridad: "media",
      categoriaNotif: "expedientes",
    });
    await supabase.from("expedientes").update({ aviso_por_vencer_enviado: true }).eq("id", e.id);
    avisados++;
  }
  return avisados;
}

async function avisarRecordatoriosPostventaVencidos(): Promise<number> {
  const hoy = fechaHoyIso();
  const { data: recordatorios } = await supabase
    .from("postventa_recordatorios")
    .select("id, compra_id, tipo, fecha_vencimiento, descripcion, estado, creado_por, aviso_enviado")
    .eq("estado", "pendiente")
    .eq("aviso_enviado", false)
    .lte("fecha_vencimiento", hoy);

  if (!recordatorios || recordatorios.length === 0) return 0;
  const compraIds = [...new Set(recordatorios.map((r) => r.compra_id))];
  const { data: compras } = await supabase.from("postventa_compras").select("id, comprador_nombre, vehiculo_marca, vehiculo_modelo").in("id", compraIds);
  const compraMap = new Map((compras ?? []).map((c) => [c.id, c]));

  let avisados = 0;
  for (const r of recordatorios) {
    if (!r.creado_por) continue;
    const compra = compraMap.get(r.compra_id);
    await crearAlerta(supabase, r.creado_por, `Recordatorio de postventa: ${r.tipo} — ${compra?.comprador_nombre || "cliente"}`, {
      mensaje: [compra ? `${compra.vehiculo_marca || ""} ${compra.vehiculo_modelo || ""}`.trim() : null, r.descripcion].filter(Boolean).join(" · ") || undefined,
      link: "/panel/postventa",
      tipo: "postventa_recordatorio_vencido",
      prioridad: "media",
      categoriaNotif: "service_sla",
    });
    await supabase.from("postventa_recordatorios").update({ aviso_enviado: true }).eq("id", r.id);
    avisados++;
  }
  return avisados;
}

async function avisarServiceSinOfrecer(): Promise<number> {
  const limite = fechaHaceDiasIso(DIAS_MARGEN_SERVICE_SIN_OFRECER);
  const { data: compras } = await supabase
    .from("postventa_compras")
    .select("id, comprador_nombre, vehiculo_marca, vehiculo_modelo, fecha_venta, creado_por, aviso_service_enviado")
    .lte("fecha_venta", limite)
    .eq("aviso_service_enviado", false);

  if (!compras || compras.length === 0) return 0;
  const compraIds = compras.map((c) => c.id);
  const { data: recordatoriosService } = await supabase.from("postventa_recordatorios").select("compra_id").eq("tipo", "service").in("compra_id", compraIds);
  const conService = new Set((recordatoriosService ?? []).map((r) => r.compra_id));

  let avisados = 0;
  for (const c of compras) {
    if (conService.has(c.id)) { await supabase.from("postventa_compras").update({ aviso_service_enviado: true }).eq("id", c.id); continue; }
    if (!c.creado_por) continue;
    await crearAlerta(supabase, c.creado_por, `Service sin contactar — ${c.comprador_nombre}`, {
      mensaje: `${c.comprador_nombre} compró ${c.vehiculo_marca || ""} ${c.vehiculo_modelo || ""} y todavía nadie le ofreció el service.`.trim(),
      link: "/panel/postventa",
      tipo: "service_sin_contactar",
      prioridad: "alta",
      categoriaNotif: "service_sla",
    });
    await supabase.from("postventa_compras").update({ aviso_service_enviado: true }).eq("id", c.id);
    avisados++;
  }
  return avisados;
}

const ESTANCADO_DIAS = 3; // mismo umbral que ReclamosClient.tsx

async function avisarReclamosEstancados(): Promise<number> {
  const { data: reclamos } = await supabase
    .from("reclamos")
    .select("id, titulo, estado, asignado_a, creado_por, ultimo_movimiento_at, aviso_estancado_fecha")
    .neq("estado", "cerrado");

  let avisados = 0;
  for (const r of reclamos ?? []) {
    const destinatario = r.asignado_a || r.creado_por;
    if (!destinatario || !r.ultimo_movimiento_at) continue;
    const dias = (Date.now() - new Date(r.ultimo_movimiento_at).getTime()) / 86400000;
    if (dias < ESTANCADO_DIAS) continue;
    if (r.aviso_estancado_fecha === r.ultimo_movimiento_at) continue; // ya se avisó desde el último movimiento

    await crearAlerta(supabase, destinatario, `Reclamo estancado: ${r.titulo || "sin título"}`, {
      mensaje: `Sin movimiento hace ${Math.floor(dias)} días.`,
      link: `/panel/reclamos?reclamo=${r.id}`,
      tipo: "reclamo_estancado",
      modulo: "reclamos",
      categoriaNotif: "reclamos",
      prioridad: "media",
    });
    await supabase.from("reclamos").update({ aviso_estancado_fecha: r.ultimo_movimiento_at }).eq("id", r.id);
    avisados++;
  }
  return avisados;
}

async function avisarTareasVencidas(): Promise<number> {
  const hoy = new Date().toISOString();
  const { data: tareas } = await supabase
    .from("tareas_lead")
    .select("id, titulo, tipo, fecha_vencimiento, completada, creado_por, aviso_vencida_enviado")
    .eq("completada", false)
    .eq("aviso_vencida_enviado", false)
    .lt("fecha_vencimiento", hoy);

  let avisados = 0;
  for (const t of tareas ?? []) {
    if (!t.creado_por) continue;
    await crearAlerta(supabase, t.creado_por, `Tarea vencida: ${t.titulo || t.tipo || "sin título"}`, {
      link: "/panel/tareas",
      tipo: "tarea_lead_vencida",
      prioridad: "media",
    });
    await supabase.from("tareas_lead").update({ aviso_vencida_enviado: true }).eq("id", t.id);
    avisados++;
  }
  return avisados;
}

async function avisarCuotasPorVencer(): Promise<number> {
  const hoy = fechaHoyIso();
  let avisados = 0;

  const { data: cobrar } = await supabase
    .from("cuotas_cobrar_clientes")
    .select("id, concepto, monto, moneda, vendedor_id, creado_por, vencimiento, cobrada, aviso_vencimiento_enviado")
    .eq("cobrada", false)
    .eq("aviso_vencimiento_enviado", false)
    .lte("vencimiento", hoy);
  for (const c of cobrar ?? []) {
    const destinatario = c.vendedor_id || c.creado_por;
    if (!destinatario) continue;
    const vencida = c.vencimiento < hoy;
    await crearAlerta(supabase, destinatario, `Cuota a cobrar ${vencida ? "vencida" : "vence hoy"}: ${c.concepto || ""}`.trim(), {
      mensaje: `${c.moneda} ${Number(c.monto).toLocaleString("es-AR")}`,
      link: "/panel/cobros",
      tipo: "cuota_cobrar_vencimiento",
      prioridad: vencida ? "alta" : "media",
      categoriaNotif: "finanzas",
    });
    await supabase.from("cuotas_cobrar_clientes").update({ aviso_vencimiento_enviado: true }).eq("id", c.id);
    avisados++;
  }

  const { data: pagar } = await supabase
    .from("cuotas_pagar_agencia")
    .select("id, acreedor, concepto, monto, moneda, creado_por, vencimiento, pagada, aviso_vencimiento_enviado")
    .eq("pagada", false)
    .eq("aviso_vencimiento_enviado", false)
    .lte("vencimiento", hoy);
  for (const p of pagar ?? []) {
    if (!p.creado_por) continue;
    const vencida = p.vencimiento < hoy;
    await crearAlerta(supabase, p.creado_por, `Cuota a pagar ${vencida ? "vencida" : "vence hoy"}: ${p.acreedor}`, {
      mensaje: `${p.moneda} ${Number(p.monto).toLocaleString("es-AR")}${p.concepto ? ` · ${p.concepto}` : ""}`,
      link: "/panel/finanzas",
      tipo: "cuota_pagar_vencimiento",
      prioridad: vencida ? "alta" : "media",
      categoriaNotif: "finanzas",
    });
    await supabase.from("cuotas_pagar_agencia").update({ aviso_vencimiento_enviado: true }).eq("id", p.id);
    avisados++;
  }

  return avisados;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [consignaciones, expedientes, recordatorios, service, reclamosEstancados, tareasVencidas, cuotasPorVencer] = await Promise.all([
    avisarConsignacionesSinContacto(),
    avisarExpedientesPorVencer(),
    avisarRecordatoriosPostventaVencidos(),
    avisarServiceSinOfrecer(),
    avisarReclamosEstancados(),
    avisarTareasVencidas(),
    avisarCuotasPorVencer(),
  ]);

  return Response.json({ ok: true, consignaciones, expedientes, recordatorios, service, reclamosEstancados, tareasVencidas, cuotasPorVencer });
}
