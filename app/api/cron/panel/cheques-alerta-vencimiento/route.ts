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

  const en3Dias = new Date(`${hoyArgentina()}T12:00:00Z`);
  en3Dias.setUTCDate(en3Dias.getUTCDate() + 3);
  const fechaObjetivo = en3Dias.toISOString().slice(0, 10);

  const { data: cheques, error } = await supabase
    .from("cheques")
    .select("id, tipo, librador, banco, monto, moneda, fecha_cobro")
    .eq("estado", "pendiente")
    .eq("fecha_cobro", fechaObjetivo);

  if (error) {
    registrarError("cron/cheques-alerta-vencimiento", error);
    return Response.json({ error: "No se pudo consultar los cheques." }, { status: 500 });
  }

  if (!cheques?.length) return Response.json({ ok: true, avisados: 0 });

  const { data: destinatarios } = await supabase.from("perfiles").select("id").or("roles.cs.{admin},roles.cs.{encargado},roles.cs.{finanzas}").eq("activo", true);

  let avisados = 0;
  for (const c of cheques) {
    const monto = `${c.moneda === "USD" ? "USD" : "$"} ${Number(c.monto).toLocaleString("es-AR")}`;
    const titulo = c.tipo === "emitido" ? `Cheque a pagar en 3 días — ${c.librador}` : `Cheque a cobrar en 3 días — ${c.librador}`;
    const mensaje = `${monto}${c.banco ? ` · ${c.banco}` : ""} · vence el ${c.fecha_cobro}. ${c.tipo === "emitido" ? "Asegurá fondos en cuenta." : "Revisá el estado antes de depositarlo."}`;
    for (const d of destinatarios || []) {
      await crearAlerta(supabase, d.id, titulo, {
        mensaje, link: "/panel/finanzas?tab=cheques", tipo: "cheque_por_vencer", prioridad: "alta",
      });
    }
    avisados++;
  }

  return Response.json({ ok: true, avisados });
}
