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

  const { data: config } = await supabase.from("configuracion_empresa").select("*").eq("id", true).maybeSingle();
  if (!config?.resumen_diario_activo) return Response.json({ ok: true, motivo: "desactivado" });

  const hoy = hoyArgentina();
  if (config.resumen_diario_ultimo_envio === hoy) return Response.json({ ok: true, motivo: "ya_enviado_hoy" });
  if (horaActualArgentina() < (config.resumen_diario_hora ?? 8)) return Response.json({ ok: true, motivo: "todavia_no_es_la_hora" });

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

  const desdeHoy = new Date(`${hoy}T00:00:00-03:00`).toISOString();
  const [{ count: ventasHoy }, { count: leadsHoy }] = await Promise.all([
    supabase.from("ventas").select("id", { count: "exact", head: true }).eq("estado", "cerrada").gte("fecha_cierre", desdeHoy),
    supabase.from("clientes").select("id", { count: "exact", head: true }).gte("created_at", desdeHoy),
  ]);

  const fechaCorta = new Date(`${hoy}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
  const nombreAgencia = config.resumen_diario_nombre || config.branding_nombre || "tu agencia";
  const textoDigest =
    `☀️ ${nombreAgencia} — ${fechaCorta}\n` +
    `🛒 Ventas cerradas hoy: ${ventasHoy ?? 0}\n` +
    `🆕 Leads nuevos hoy: ${leadsHoy ?? 0}\n` +
    `💵 Caja: ${cajaTexto}`;

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
        await sendTemplateMessage(waConfig.phone_number_id, wToken, config.resumen_diario_telefono_dueno, config.resumen_diario_plantilla_meta, config.resumen_diario_idioma || "es_AR", textoDigest);
      }
    } catch (err) {
      const msg = err instanceof MetaApiError ? err.message : "error desconocido";
      registrarError("cron/resumen-empresa:whatsapp", err, { detalle: msg });
    }
  }

  await supabase.from("configuracion_empresa").update({ resumen_diario_ultimo_envio: hoy }).eq("id", true);

  return Response.json({ ok: true, enviados: admins?.length ?? 0 });
}
