import { createClient } from "@supabase/supabase-js";
import { crearAlerta } from "@/lib/panel/alertas";
import { registrarError } from "@/lib/panel/logger";

// Corre 1 vez por día vía pg_cron. Pedido de la reunión del 22/9: avisar 3
// días antes de que llegue la fecha de cobro/pago de un cheque, para poder
// asegurar fondos en cuenta antes de que se presente y evitar un rechazo.
// No confundir con el cron cheques-depositar (que pasa el cheque a
// "depositado" el día que llega la fecha) -- este solo avisa antes, no
// cambia ningún estado.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

function hoyArgentina() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const hoy = hoyArgentina();
  const en3Dias = new Date(`${hoy}T12:00:00Z`);
  en3Dias.setUTCDate(en3Dias.getUTCDate() + 3);
  const fechaLimite = en3Dias.toISOString().slice(0, 10);

  const { data: destinatarios } = await supabase.from("perfiles").select("id").or("roles.cs.{admin},roles.cs.{encargado},roles.cs.{finanzas}").eq("activo", true);

  let avisados = 0;

  // Por vencer -- antes comparaba fecha_cobro = hoy+3 EXACTO, así que un
  // cheque cargado con 1-2 días de plazo, o un día que el cron no corrió,
  // nunca recibía aviso. Ahora es un rango (hoy..hoy+3) con flag propio, para
  // no repetir el aviso todos los días una vez mandado.
  const { data: porVencer, error: errorPorVencer } = await supabase
    .from("cheques")
    .select("id, tipo, librador, banco, monto, moneda, fecha_cobro")
    .eq("estado", "pendiente")
    .eq("aviso_vencimiento_enviado", false)
    .gte("fecha_cobro", hoy)
    .lte("fecha_cobro", fechaLimite);

  if (errorPorVencer) {
    registrarError("cron/cheques-alerta-vencimiento:por-vencer", errorPorVencer);
  } else {
    for (const c of porVencer || []) {
      const monto = `${c.moneda === "USD" ? "USD" : "$"} ${Number(c.monto).toLocaleString("es-AR")}`;
      const titulo = c.tipo === "emitido" ? `Cheque a pagar el ${c.fecha_cobro} — ${c.librador}` : `Cheque a cobrar el ${c.fecha_cobro} — ${c.librador}`;
      const mensaje = `${monto}${c.banco ? ` · ${c.banco}` : ""} · vence el ${c.fecha_cobro}. ${c.tipo === "emitido" ? "Asegurá fondos en cuenta." : "Revisá el estado antes de depositarlo."}`;
      for (const d of destinatarios || []) {
        await crearAlerta(supabase, d.id, titulo, {
          mensaje, link: "/panel/finanzas?tab=cheques", tipo: "cheque_por_vencer", prioridad: "alta",
        });
      }
      await supabase.from("cheques").update({ aviso_vencimiento_enviado: true }).eq("id", c.id);
      avisados++;
    }
  }

  // Ya vencidos y sin resolver -- antes esto no existía: un cheque "pendiente"
  // que pasa su fecha de cobro sin que nadie lo marque cobrado/rechazado
  // nunca generaba ningún aviso nuevo (el KPI "Vencidos sin resolver" del
  // panel lo cuenta, pero nadie recibía notificación real).
  const { data: vencidos, error: errorVencidos } = await supabase
    .from("cheques")
    .select("id, tipo, librador, banco, monto, moneda, fecha_cobro")
    .eq("estado", "pendiente")
    .eq("aviso_vencido_enviado", false)
    .lt("fecha_cobro", hoy);

  if (errorVencidos) {
    registrarError("cron/cheques-alerta-vencimiento:vencidos", errorVencidos);
  } else {
    for (const c of vencidos || []) {
      const monto = `${c.moneda === "USD" ? "USD" : "$"} ${Number(c.monto).toLocaleString("es-AR")}`;
      const titulo = `Cheque vencido sin resolver — ${c.librador}`;
      const mensaje = `${monto}${c.banco ? ` · ${c.banco}` : ""} · venció el ${c.fecha_cobro} y sigue pendiente. Marcalo cobrado, rechazado o endosado.`;
      for (const d of destinatarios || []) {
        await crearAlerta(supabase, d.id, titulo, {
          mensaje, link: "/panel/finanzas?tab=cheques", tipo: "cheque_vencido", prioridad: "alta",
        });
      }
      await supabase.from("cheques").update({ aviso_vencido_enviado: true }).eq("id", c.id);
      avisados++;
    }
  }

  return Response.json({ ok: true, avisados });
}
