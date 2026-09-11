import { createClient } from "@supabase/supabase-js";
import { crearAlerta } from "@/lib/panel/alertas";

// Corre 1 vez por día vía pg_cron. "Mi resumen" (Mi Espacio → primera
// pestaña del panel) dejaba elegir qué querés ver "cada mañana en la
// campanita 🔔", pero nada armaba ni mandaba ese resumen -- se guardaba la
// preferencia y ahí moría. Esto arma un resumen personal (scope: lo que le
// corresponde a CADA vendedor, salvo los 2 ítems "sensible" que son
// compañía-wide y solo se arman para admins) y lo manda como una sola
// alerta a la campanita.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

function hoyArgentina(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
}

function isoHaceHoras(horas: number): string {
  return new Date(Date.now() - horas * 3600_000).toISOString();
}

function isoHaceDias(dias: number): string {
  return new Date(Date.now() - dias * 86400_000).toISOString();
}

function fechaHoyIso(): string {
  return hoyArgentina().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
}

function fechaEnDiasIso(dias: number): string {
  const d = new Date(`${fechaHoyIso()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

async function contar(tabla: string, filtros: Record<string, any>): Promise<number> {
  let q = supabase.from(tabla).select("id", { count: "exact", head: true });
  for (const [k, v] of Object.entries(filtros)) {
    if (Array.isArray(v) && v[0] === "gte") q = q.gte(k, v[1]);
    else if (Array.isArray(v) && v[0] === "lt") q = q.lt(k, v[1]);
    else if (Array.isArray(v) && v[0] === "lte") q = q.lte(k, v[1]);
    else if (Array.isArray(v) && v[0] === "neq") q = q.neq(k, v[1]);
    else q = q.eq(k, v);
  }
  const { count } = await q;
  return count ?? 0;
}

async function armarResumenPersonal(perfilId: string, items: string[], esAdmin: boolean, umbralAtraso: number): Promise<string[]> {
  const lineas: string[] = [];

  if (items.includes("ventas_cerradas")) {
    const [dia, semana] = await Promise.all([
      contar("ventas", { vendedor_id: perfilId, estado: "cerrada", fecha_cierre: ["gte", isoHaceHoras(24)] }),
      contar("ventas", { vendedor_id: perfilId, estado: "cerrada", fecha_cierre: ["gte", isoHaceDias(7)] }),
    ]);
    if (dia > 0 || semana > 0) lineas.push(`🛒 Ventas cerradas: ${dia} en las últimas 24h, ${semana} en la semana`);
  }

  if (items.includes("leads_nuevos")) {
    const [dia, semana] = await Promise.all([
      contar("clientes", { vendedor_id: perfilId, created_at: ["gte", isoHaceHoras(24)] }),
      contar("clientes", { vendedor_id: perfilId, created_at: ["gte", isoHaceDias(7)] }),
    ]);
    if (dia > 0 || semana > 0) lineas.push(`🆕 Leads nuevos: ${dia} en las últimas 24h, ${semana} en la semana`);
  }

  if (items.includes("expedientes_atrasados")) {
    const atrasados = await contar("expedientes", { gestor_asignado_id: perfilId, estado: ["neq", "cerrado"], created_at: ["lt", isoHaceDias(umbralAtraso)] });
    if (atrasados > 0) lineas.push(`📁 Expedientes atrasados (más de ${umbralAtraso} días sin cerrar): ${atrasados}`);
  }

  if (items.includes("cuotas")) {
    const [porVencer, vencidas] = await Promise.all([
      contar("cuotas_cobrar_clientes", { vendedor_id: perfilId, cobrada: false, vencimiento: ["lte", fechaEnDiasIso(7)] }),
      contar("cuotas_cobrar_clientes", { vendedor_id: perfilId, cobrada: false, vencimiento: ["lt", fechaHoyIso()] }),
    ]);
    if (porVencer > 0 || vencidas > 0) lineas.push(`💳 Cuotas: ${vencidas} vencidas, ${porVencer} por vencer en 7 días`);
  }

  if (items.includes("stock_disponible")) {
    const disponibles = await contar("vehiculos", { estado: "disponible" });
    lineas.push(`🚗 Stock disponible: ${disponibles} vehículos`);
  }

  if (items.includes("cotizaciones_nuevas")) {
    const nuevas = await contar("cotizaciones", { vendedor_id: perfilId, created_at: ["gte", isoHaceHoras(24)] });
    if (nuevas > 0) lineas.push(`📄 Cotizaciones nuevas: ${nuevas} en las últimas 24h`);
  }

  if (items.includes("clientes_ingresaron")) {
    const [dia, semana] = await Promise.all([
      contar("clientes", { vendedor_id: perfilId, estado_relacion: "cliente", created_at: ["gte", isoHaceHoras(24)] }),
      contar("clientes", { vendedor_id: perfilId, estado_relacion: "cliente", created_at: ["gte", isoHaceDias(7)] }),
    ]);
    if (dia > 0 || semana > 0) lineas.push(`👤 Clientes que ingresaron: ${dia} en las últimas 24h, ${semana} en la semana`);
  }

  if (items.includes("clientes_sin_contactar")) {
    const sinContactar = await contar("clientes", { vendedor_id: perfilId, pipeline_stage: "sin_contactar" });
    if (sinContactar > 0) lineas.push(`⏳ Clientes sin contactar: ${sinContactar}`);
  }

  if (items.includes("reclamos_abiertos")) {
    const abiertos = await contar("reclamos", { asignado_a: perfilId, estado: "abierto" });
    if (abiertos > 0) lineas.push(`📣 Reclamos abiertos: ${abiertos}`);
  }

  if (esAdmin && items.includes("autorizaciones_pendientes")) {
    const pendientes = await contar("autorizaciones", { estado: "pendiente" });
    if (pendientes > 0) lineas.push(`🔐 Autorizaciones pendientes: ${pendientes}`);
  }

  if (esAdmin && items.includes("saldos_caja")) {
    const { data: cuentas } = await supabase.from("cuentas").select("id, moneda").eq("activa", true);
    const porMoneda: Record<string, number> = {};
    for (const c of cuentas ?? []) {
      const { data: saldo } = await supabase.rpc("saldo_cuenta", { p_cuenta_id: c.id });
      porMoneda[c.moneda] = (porMoneda[c.moneda] ?? 0) + Number(saldo ?? 0);
    }
    const partes = Object.entries(porMoneda).map(([m, n]) => `${m} ${n.toLocaleString("es-AR")}`);
    if (partes.length) lineas.push(`🏦 Saldos de caja: ${partes.join(" · ")}`);
  }

  return lineas;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: config } = await supabase.from("configuracion_empresa").select("resumen_diario_dias_expediente_atrasado").eq("id", true).maybeSingle();
  const umbralAtraso = config?.resumen_diario_dias_expediente_atrasado ?? 5;

  const { data: perfiles } = await supabase.from("perfiles").select("id, roles, activo").eq("activo", true);
  const { data: todasLasPrefs } = await supabase.from("espacio_resumen_prefs").select("perfil_id, recibir_resumen, items");
  const prefsMap = new Map((todasLasPrefs ?? []).map((p) => [p.perfil_id, p]));
  const ITEMS_DEFAULT = [
    "ventas_cerradas", "leads_nuevos", "expedientes_atrasados", "cuotas", "stock_disponible",
    "cotizaciones_nuevas", "clientes_ingresaron", "clientes_sin_contactar", "reclamos_abiertos",
    "autorizaciones_pendientes", "saldos_caja",
  ];

  let enviados = 0;
  for (const p of perfiles ?? []) {
    const prefs = prefsMap.get(p.id);
    const recibir = prefs?.recibir_resumen ?? true; // default: opt-in por diseño del tab
    if (!recibir) continue;
    const items = prefs?.items ?? ITEMS_DEFAULT;
    const esAdmin = !!p.roles?.includes("admin");

    const lineas = await armarResumenPersonal(p.id, items, esAdmin, umbralAtraso);
    if (lineas.length === 0) continue; // nada relevante para contar hoy

    await crearAlerta(supabase, p.id, "Tu resumen de hoy 📊", {
      mensaje: lineas.join("\n"),
      link: "/panel/mi-espacio?tab=mi-resumen",
      tipo: "mi_resumen_diario",
      prioridad: "baja",
      modulo: "mi_espacio",
    });
    enviados++;
  }

  return Response.json({ ok: true, enviados });
}
