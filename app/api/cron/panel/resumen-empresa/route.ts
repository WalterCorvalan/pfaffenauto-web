import { createClient } from "@supabase/supabase-js";
import { crearAlerta } from "@/lib/panel/alertas";
import { sendTemplateMessage, MetaApiError } from "@/lib/meta/client";
import { decrypt } from "@/lib/crypto";
import { registrarError } from "@/lib/panel/logger";

// Corre cada hora vía pg_cron, pero solo hace algo en la hora configurada
// (configuracion_empresa.resumen_diario_hora) y una sola vez por día
// (resumen_diario_ultimo_envio). "Resumen diario" (Configuración → Empresa)
// dejaba activar esto y elegir hora/plantilla de WhatsApp, pero no había
// ningún proceso que lo generara -- ni como alerta en el panel ni por
// WhatsApp.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

function hoyArgentina() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
}
function horaActualArgentina(): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", hour: "numeric", hourCycle: "h23" }).format(new Date()));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  // ?preview=1: devuelve el texto del resumen SIN enviar nada ni marcarlo como enviado (para ver cómo queda y para probar).
  const preview = url.searchParams.get("preview") === "1";

  const { data: config } = await supabase.from("configuracion_empresa").select("*").eq("id", true).maybeSingle();
  if (!preview && !config?.resumen_diario_activo) return Response.json({ ok: true, motivo: "desactivado" });

  const hoy = hoyArgentina();
  if (!preview && config.resumen_diario_ultimo_envio === hoy) return Response.json({ ok: true, motivo: "ya_enviado_hoy" });
  if (!preview && horaActualArgentina() < (config.resumen_diario_hora ?? 8)) return Response.json({ ok: true, motivo: "todavia_no_es_la_hora" });

  // Caja: saldo real por moneda, sumando todas las cuentas activas (mismo
  // criterio que Finanzas → Cuentas: el saldo nunca se cachea, se calcula
  // en vivo con el RPC saldo_cuenta).
  const { data: cuentas } = await supabase.from("cuentas").select("id, moneda").eq("activa", true);
  const porMoneda: Record<string, number> = {};
  for (const c of cuentas ?? []) {
    const { data: saldo } = await supabase.rpc("saldo_cuenta", { p_cuenta_id: c.id });
    porMoneda[c.moneda] = (porMoneda[c.moneda] ?? 0) + Number(saldo ?? 0);
  }
  const cajaTexto = Object.entries(porMoneda).map(([m, n]) => `${m} ${n.toLocaleString("es-AR")}`).join(" · ") || "sin cuentas activas";

  // ---- Resumen armado con reglas (SIN IA, no gasta la API): lo urgente de hoy + cómo viene el día + caja y patrimonio ----
  const desdeHoy = new Date(`${hoy}T00:00:00-03:00`).toISOString();
  const hace90 = new Date(Date.now() - 90 * 86400000).toISOString();
  const TABLAS_LEADS = ["whatsapp_conversaciones", "instagram_conversaciones", "rodi_conversaciones", "messenger_conversaciones", "leads_manuales"];
  const sumar = (res: { count: number | null }[]) => res.reduce((a, r) => a + (r.count ?? 0), 0);

  const [leadsSinAtender, leadsSinAsignar, leadsHoy, ventasHoy, cuotasCobrarVenc, cuotasPagarVenc, estancados, comisionesPend, tareasVenc, fotos] = await Promise.all([
    Promise.all(TABLAS_LEADS.map((t) => supabase.from(t).select("id", { count: "exact", head: true }).or("estado_lead.eq.nuevo,estado_lead.is.null"))).then(sumar),
    Promise.all(TABLAS_LEADS.map((t) => supabase.from(t).select("id", { count: "exact", head: true }).is("vendedor_id", null).or("estado_lead.eq.nuevo,estado_lead.is.null"))).then(sumar),
    Promise.all(TABLAS_LEADS.map((t) => supabase.from(t).select("id", { count: "exact", head: true }).gte("created_at", desdeHoy))).then(sumar),
    supabase.from("ventas").select("id", { count: "exact", head: true }).eq("estado", "cerrada").eq("fecha_cierre", hoy),
    supabase.from("cuotas_cobrar_clientes").select("monto, monto_cobrado, moneda").eq("cobrada", false).lt("vencimiento", hoy),
    supabase.from("cuotas_pagar_agencia").select("monto, monto_pagado, moneda").eq("pagada", false).lt("vencimiento", hoy),
    supabase.from("vehiculos").select("id", { count: "exact", head: true }).eq("estado", "disponible").lt("created_at", hace90),
    supabase.from("comisiones").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
    supabase.from("tareas_lead").select("id", { count: "exact", head: true }).eq("completada", false).lt("fecha_vencimiento", hoy),
    supabase.from("patrimonio_fotos").select("fecha, moneda, patrimonio_costo").order("fecha", { ascending: false }).limit(8),
  ]);

  const fmtMonto = (n: number, moneda: string) => `${moneda === "USD" ? "USD" : "$"} ${Math.round(n).toLocaleString("es-AR")}`;
  const resumirCuotas = (filas: { monto: number; moneda: string; monto_cobrado?: number | null; monto_pagado?: number | null }[] | null) => {
    const m: Record<string, number> = {};
    (filas ?? []).forEach((c) => { m[c.moneda] = (m[c.moneda] ?? 0) + Number(c.monto) - Number(c.monto_cobrado ?? c.monto_pagado ?? 0); });
    return { cantidad: (filas ?? []).length, texto: Object.entries(m).map(([mon, n]) => fmtMonto(n, mon)).join(" y ") };
  };
  const cobros = resumirCuotas(cuotasCobrarVenc.data);
  const pagos = resumirCuotas(cuotasPagarVenc.data);

  // Lo urgente: solo aparece lo que tiene algo para hacer, de más a menos importante.
  const urgentes: string[] = [];
  if (leadsSinAsignar > 0) urgentes.push(`${leadsSinAsignar} lead${leadsSinAsignar === 1 ? "" : "s"} sin vendedor asignado`);
  if (leadsSinAtender > 0) urgentes.push(`${leadsSinAtender} lead${leadsSinAtender === 1 ? "" : "s"} sin atender`);
  if (cobros.cantidad > 0) urgentes.push(`${cobros.cantidad} cobro${cobros.cantidad === 1 ? "" : "s"} vencido${cobros.cantidad === 1 ? "" : "s"} (${cobros.texto})`);
  if (pagos.cantidad > 0) urgentes.push(`${pagos.cantidad} pago${pagos.cantidad === 1 ? "" : "s"} vencido${pagos.cantidad === 1 ? "" : "s"} (${pagos.texto})`);
  if ((tareasVenc.count ?? 0) > 0) urgentes.push(`${tareasVenc.count} tarea${tareasVenc.count === 1 ? "" : "s"} de seguimiento vencida${tareasVenc.count === 1 ? "" : "s"}`);
  if ((comisionesPend.count ?? 0) > 0) urgentes.push(`${comisionesPend.count} comisión${comisionesPend.count === 1 ? "" : "es"} pendiente${comisionesPend.count === 1 ? "" : "s"} de pago`);
  if ((estancados.count ?? 0) > 0) urgentes.push(`${estancados.count} auto${estancados.count === 1 ? "" : "s"} con más de 90 días en stock`);

  // Patrimonio: última foto contra la anterior, por moneda (a costo).
  const lineasPatrimonio: string[] = [];
  ["ARS", "USD"].forEach((mon) => {
    const delaMoneda = (fotos.data ?? []).filter((x) => x.moneda === mon);
    if (delaMoneda.length === 0 || Number(delaMoneda[0].patrimonio_costo) === 0) return;
    const dif = delaMoneda.length > 1 ? Number(delaMoneda[0].patrimonio_costo) - Number(delaMoneda[1].patrimonio_costo) : null;
    lineasPatrimonio.push(`${fmtMonto(Number(delaMoneda[0].patrimonio_costo), mon)}${dif == null ? "" : ` (${dif >= 0 ? "+" : "−"}${fmtMonto(Math.abs(dif), mon)} vs. el día anterior)`}`);
  });

  const fechaCorta = new Date(`${hoy}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
  const nombreAgencia = config.resumen_diario_nombre || config.branding_nombre || "tu agencia";
  const lineas = [
    `☀️ ${nombreAgencia} — ${fechaCorta}`,
    urgentes.length > 0 ? `⚠️ Para atender hoy:\n${urgentes.slice(0, 5).map((u) => `• ${u}`).join("\n")}` : "✅ Nada urgente: no hay pendientes que atender hoy.",
    `🛒 Ventas cerradas hoy: ${ventasHoy.count ?? 0} · 🆕 Leads nuevos hoy: ${leadsHoy}`,
    `💵 Caja: ${cajaTexto}`,
    ...(lineasPatrimonio.length > 0 ? [`📈 Patrimonio (a costo): ${lineasPatrimonio.join(" · ")}`] : []),
  ];
  const textoDigest = lineas.join("\n");
  // WhatsApp no admite saltos de línea dentro de la variable de una plantilla: se manda todo en una sola línea.
  const textoWhatsapp = lineas.join(" | ").replace(/\n/g, " ");
  if (preview) return Response.json({ ok: true, preview: true, texto: textoDigest, whatsapp: textoWhatsapp });
  const { data: admins } = await supabase.from("perfiles").select("id").eq("activo", true).contains("roles", ["admin"]);
  for (const a of admins ?? []) {
    await crearAlerta(supabase, a.id, `Resumen del día — ${fechaCorta}`, {
      mensaje: textoDigest,
      link: "/panel",
      tipo: "resumen_diario_empresa",
      prioridad: "novedad",
    });
  }

  // WhatsApp es un plus opcional aparte del toggle general -- si falla algo
  // acá (plantilla no aprobada, WhatsApp no configurado, etc.) no debe
  // frenar el envío de la alerta en el panel, que ya se mandó arriba.
  if (config.resumen_diario_whatsapp_activo && config.resumen_diario_telefono_dueno && config.resumen_diario_plantilla_meta) {
    try {
      const { data: waConfig } = await supabase.from("whatsapp_configuracion").select("phone_number_id, token_cifrado, token_iv, token_tag").eq("id", true).maybeSingle();
      if (waConfig?.phone_number_id && waConfig.token_cifrado) {
        const wToken = decrypt(waConfig.token_cifrado, waConfig.token_iv, waConfig.token_tag);
        await sendTemplateMessage(waConfig.phone_number_id, wToken, config.resumen_diario_telefono_dueno, config.resumen_diario_plantilla_meta, config.resumen_diario_idioma || "es_AR", textoWhatsapp);
      }
    } catch (err) {
      const msg = err instanceof MetaApiError ? err.message : "error desconocido";
      registrarError("cron/resumen-empresa:whatsapp", err, { detalle: msg });
    }
  }

  await supabase.from("configuracion_empresa").update({ resumen_diario_ultimo_envio: hoy }).eq("id", true);

  return Response.json({ ok: true, enviados: admins?.length ?? 0 });
}
