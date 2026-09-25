import { createClient } from "@supabase/supabase-js";
import { crearAlerta } from "@/lib/panel/alertas";
import { sendTemplateMessage, MetaApiError } from "@/lib/meta/client";
import { decrypt } from "@/lib/crypto";
import { registrarError } from "@/lib/panel/logger";

// Corre 1 vez por día vía pg_cron. "Mi resumen" (Mi Espacio → primera
// pestaña del panel) dejaba elegir qué querés ver "cada mañana en la
// campanita 🔔", pero nada armaba ni mandaba ese resumen -- se guardaba la
// preferencia y ahí moría. Esto arma un resumen personal (scope: lo que le
// corresponde a CADA vendedor, salvo los 2 ítems "sensible" que son
// compañía-wide y solo se arman para admins) y lo manda como una sola
// alerta a la campanita.
//
// Antes existía un segundo cron aparte ("resumen-empresa", corriendo cada
// hora) que mandaba OTRA alerta separada ("Resumen del día — fecha", solo a
// admins, con ventas/leads/caja de TODA la empresa). Título sin fecha acá
// ("Tu resumen de hoy 📊" fijo) hacía que agruparAlertas.ts (agrupa por
// tipo+título) juntara el de hoy con el de ayer sin cerrar y mostrara "x2"
// aunque solo se hubiera mandado una vez por día -- eso, sumado a que las
// dos alertas se veían casi iguales, es lo que se reportó como "duplicado".
// Se fusionaron en una sola alerta con fecha en el título: para admins
// incluye el bloque de empresa completa (antes de resumen-empresa) arriba
// de su resumen personal; para el resto del equipo, solo lo personal. El
// cron/endpoint de resumen-empresa se da de baja (ver
// migraciones/sql_unschedule_resumen_empresa.sql).

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

function hoyArgentinaIso(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
}

// Mismo cálculo que tenía el viejo cron de resumen-empresa: saldo real por
// moneda, sumando todas las cuentas activas (nunca se cachea, RPC saldo_cuenta).
async function calcularCajaTexto(): Promise<string> {
  const { data: cuentas } = await supabase.from("cuentas").select("id, moneda").eq("activa", true);
  const porMoneda: Record<string, number> = {};
  for (const c of cuentas ?? []) {
    const { data: saldo } = await supabase.rpc("saldo_cuenta", { p_cuenta_id: c.id });
    porMoneda[c.moneda] = (porMoneda[c.moneda] ?? 0) + Number(saldo ?? 0);
  }
  return Object.entries(porMoneda).map(([m, n]) => `${m} ${n.toLocaleString("es-AR")}`).join(" · ") || "sin cuentas activas";
}

// Bloque de empresa completa (todos los vendedores, no solo el destinatario)
// que antes mandaba el cron aparte "resumen-empresa" -- ahora se antepone al
// resumen personal de cada admin en vez de ser una alerta separada.
async function armarBloqueEmpresa(hoy: string, nombreAgencia: string): Promise<string[]> {
  const desdeHoy = new Date(`${hoy}T00:00:00-03:00`).toISOString();
  const [{ count: ventasHoy }, { count: leadsHoy }, cajaTexto] = await Promise.all([
    supabase.from("ventas").select("id", { count: "exact", head: true }).eq("estado", "cerrada").gte("fecha_cierre", desdeHoy),
    supabase.from("clientes").select("id", { count: "exact", head: true }).gte("created_at", desdeHoy),
    calcularCajaTexto(),
  ]).then(([v, l, c]) => [v, l, c] as const);
  return [
    `🏢 ${nombreAgencia} — ventas cerradas hoy: ${ventasHoy ?? 0}, leads nuevos hoy: ${leadsHoy ?? 0}`,
    `💵 Caja (empresa): ${cajaTexto}`,
  ];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: config } = await supabase.from("configuracion_empresa").select("*").eq("id", true).maybeSingle();
  const umbralAtraso = config?.resumen_diario_dias_expediente_atrasado ?? 5;
  const hoy = hoyArgentinaIso();
  const fechaCorta = new Date(`${hoy}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
  const nombreAgencia = config?.resumen_diario_nombre || config?.branding_nombre || "tu agencia";
  const titulo = `Resumen del día — ${fechaCorta}`;

  const bloqueEmpresa = config?.resumen_diario_activo ? await armarBloqueEmpresa(hoy, nombreAgencia) : null;

  const { data: perfiles } = await supabase.from("perfiles").select("id, roles, activo").eq("activo", true);
  const { data: todasLasPrefs } = await supabase.from("espacio_resumen_prefs").select("perfil_id, recibir_resumen, items");
  const prefsMap = new Map((todasLasPrefs ?? []).map((p) => [p.perfil_id, p]));
  const ITEMS_DEFAULT = [
    "ventas_cerradas", "leads_nuevos", "expedientes_atrasados", "cuotas", "stock_disponible",
    "cotizaciones_nuevas", "clientes_ingresaron", "clientes_sin_contactar", "reclamos_abiertos",
    "autorizaciones_pendientes", "saldos_caja",
  ];

  let enviados = 0;
  let whatsappEnviado = false;
  for (const p of perfiles ?? []) {
    const prefs = prefsMap.get(p.id);
    const recibir = prefs?.recibir_resumen ?? true; // default: opt-in por diseño del tab
    if (!recibir) continue;
    const items = prefs?.items ?? ITEMS_DEFAULT;
    const esAdmin = !!p.roles?.includes("admin");

    const lineasPersonales = await armarResumenPersonal(p.id, items, esAdmin, umbralAtraso);
    const lineas = esAdmin && bloqueEmpresa ? [...bloqueEmpresa, ...lineasPersonales] : lineasPersonales;
    if (lineas.length === 0) continue; // nada relevante para contar hoy

    await crearAlerta(supabase, p.id, titulo, {
      mensaje: lineas.join("\n"),
      link: "/panel/mi-espacio?tab=mi-resumen",
      tipo: "resumen_diario",
      prioridad: "baja",
      modulo: "mi_espacio",
    });
    enviados++;

    // WhatsApp al dueño: mismo plus opcional que tenía resumen-empresa, una
    // sola vez (no por cada admin) -- si falla, no debe frenar las alertas
    // del resto del equipo, que ya se mandaron arriba.
    if (!whatsappEnviado && esAdmin && bloqueEmpresa && config?.resumen_diario_whatsapp_activo && config?.resumen_diario_telefono_dueno && config?.resumen_diario_plantilla_meta) {
      whatsappEnviado = true;
      try {
        const { data: waConfig } = await supabase.from("whatsapp_configuracion").select("phone_number_id, token_cifrado, token_iv, token_tag").eq("id", true).maybeSingle();
        if (waConfig?.phone_number_id && waConfig.token_cifrado) {
          const wToken = decrypt(waConfig.token_cifrado, waConfig.token_iv, waConfig.token_tag);
          await sendTemplateMessage(waConfig.phone_number_id, wToken, config.resumen_diario_telefono_dueno, config.resumen_diario_plantilla_meta, config.resumen_diario_idioma || "es_AR", `☀️ ${titulo}\n${bloqueEmpresa.join("\n")}`);
        }
      } catch (err) {
        const msg = err instanceof MetaApiError ? err.message : "error desconocido";
        registrarError("cron/mi-resumen:whatsapp", err, { detalle: msg });
      }
    }
  }

  return Response.json({ ok: true, enviados });
}
