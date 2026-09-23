import { createClient } from "@supabase/supabase-js";
import { crearAlerta } from "@/lib/panel/alertas";
import { registrarError } from "@/lib/panel/logger";

// Corre 1 vez por día vía pg_cron. Centraliza en una sola alerta diaria (por
// destinatario) todo lo que ya venció y sigue sin cobrarse/pagarse en
// Finanzas: cuotas a cobrar, cuotas a pagar, pagos disponibles sin cobrar y
// préstamos otorgados sin devolver. No incluye cheques -- esos ya tienen su
// propio aviso 3 días antes en cheques-alerta-vencimiento (evitar duplicar).

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

function hoyArgentina() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
}

function fmt(n: number, moneda: string) {
  return `${moneda === "USD" ? "USD" : "$"} ${Number(n).toLocaleString("es-AR")}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const hoy = hoyArgentina();

  const [{ data: cuotasCobrar, error: e1 }, { data: cuotasPagar, error: e2 }, { data: pagos, error: e3 }, { data: prestamos, error: e4 }] = await Promise.all([
    supabase.from("cuotas_cobrar_clientes").select("id, cliente:clientes(nombre), monto, monto_cobrado, moneda, vencimiento").eq("cobrada", false).lt("vencimiento", hoy),
    supabase.from("cuotas_pagar_agencia").select("id, proveedor, monto, monto_pagado, moneda, vencimiento").eq("pagada", false).lt("vencimiento", hoy),
    supabase.from("pagos_disponibles").select("id, descripcion, monto, monto_cobrado, moneda, fecha").eq("cobrado", false).lt("fecha", hoy),
    supabase.from("prestamos_otorgados").select("id, persona, monto, moneda, devolucion_esperada").eq("estado", "pendiente").not("devolucion_esperada", "is", null).lt("devolucion_esperada", hoy),
  ]);

  const error = e1 || e2 || e3 || e4;
  if (error) {
    registrarError("cron/finanzas-vencimientos", error);
    return Response.json({ error: "No se pudieron consultar los vencimientos." }, { status: 500 });
  }

  const items = [
    ...(cuotasCobrar || []).map((c) => `Cuota a cobrar de ${(c.cliente as { nombre?: string } | null)?.nombre || "cliente"} — ${fmt(Number(c.monto) - Number(c.monto_cobrado), c.moneda)} (venció ${c.vencimiento})`),
    ...(cuotasPagar || []).map((c) => `Cuota a pagar a ${c.proveedor || "proveedor"} — ${fmt(Number(c.monto) - Number(c.monto_pagado), c.moneda)} (venció ${c.vencimiento})`),
    ...(pagos || []).map((p) => `Pago disponible sin cobrar: ${p.descripcion} — ${fmt(Number(p.monto) - Number(p.monto_cobrado), p.moneda)} (venció ${p.fecha})`),
    ...(prestamos || []).map((p) => `Préstamo a ${p.persona} sin devolver — ${fmt(p.monto, p.moneda)} (esperado ${p.devolucion_esperada})`),
  ];

  if (!items.length) return Response.json({ ok: true, vencidos: 0 });

  const { data: destinatarios } = await supabase.from("perfiles").select("id").or("roles.cs.{admin},roles.cs.{encargado},roles.cs.{finanzas}").eq("activo", true);

  const titulo = `${items.length} vencimiento${items.length > 1 ? "s" : ""} sin resolver en Finanzas`;
  const mensaje = items.slice(0, 8).join(" · ") + (items.length > 8 ? ` · y ${items.length - 8} más` : "");

  for (const d of destinatarios || []) {
    await crearAlerta(supabase, d.id, titulo, {
      mensaje, link: "/panel/finanzas?tab=resumen", tipo: "finanzas_vencimiento", prioridad: "alta", categoriaNotif: "finanzas",
    });
  }

  return Response.json({ ok: true, vencidos: items.length, destinatarios: destinatarios?.length || 0 });
}
