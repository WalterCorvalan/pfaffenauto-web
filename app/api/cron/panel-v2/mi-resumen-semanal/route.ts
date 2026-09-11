import { createClient } from "@supabase/supabase-js";
import { crearAlerta } from "@/lib/panel/alertas";

// Corre 1 vez por semana (lunes) vía pg_cron. Mi Espacio → Notificaciones,
// categoría "logros", promete "avisos de cercanía a Top Seller / niveles y
// tu resumen semanal de performance" -- no existía ningún proceso que lo
// generara. Cubre la parte de resumen semanal (ventas/ranking/comisiones de
// la semana anterior); la "cercanía a Top Seller" ya se calcula en vivo en
// el Dashboard (premios_consignaciones_vendedor) y no hace falta duplicarla
// acá como alerta aparte.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

function lunesDeEstaSemana(): Date {
  const hoy = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const dia = hoy.getDay(); // 0=domingo
  const diff = dia === 0 ? 6 : dia - 1;
  hoy.setDate(hoy.getDate() - diff);
  hoy.setHours(0, 0, 0, 0);
  return hoy;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const inicioSemanaActual = lunesDeEstaSemana();
  const inicioSemanaPasada = new Date(inicioSemanaActual);
  inicioSemanaPasada.setDate(inicioSemanaPasada.getDate() - 7);
  const desde = inicioSemanaPasada.toISOString();
  const hasta = inicioSemanaActual.toISOString();
  const desdeFecha = desde.slice(0, 10);
  const hastaFecha = hasta.slice(0, 10);

  const { data: ranking } = await supabase.rpc("ranking_ventas", { p_desde: desdeFecha, p_hasta: hastaFecha });
  const rankingOrdenado = (ranking ?? []) as { vendedor_id: string; nombre: string; ventas_equivalentes: number; consignaciones: number }[];

  const { data: perfiles } = await supabase.from("perfiles").select("id, nombre").eq("activo", true).overlaps("roles", ["ventas", "encargado"]);

  let enviados = 0;
  for (const p of perfiles ?? []) {
    const posicion = rankingOrdenado.findIndex((r) => r.vendedor_id === p.id);
    const miFila = posicion >= 0 ? rankingOrdenado[posicion] : null;
    const ventas = miFila?.ventas_equivalentes ?? 0;

    const { data: comisiones } = await supabase.from("comisiones").select("monto, moneda").eq("beneficiario_id", p.id).gte("created_at", desde).lt("created_at", hasta);
    const comisionPorMoneda: Record<string, number> = {};
    for (const c of comisiones ?? []) comisionPorMoneda[c.moneda] = (comisionPorMoneda[c.moneda] ?? 0) + Number(c.monto);
    const comisionTexto = Object.entries(comisionPorMoneda).map(([m, n]) => `${m} ${n.toLocaleString("es-AR")}`).join(" · ");

    if (ventas === 0 && !comisionTexto) continue; // semana sin actividad, no hay nada que festejar/reportar

    const lineas = [`🛒 Ventas de la semana: ${ventas}`];
    if (posicion >= 0) lineas.push(`🏆 Puesto ${posicion + 1} de ${rankingOrdenado.length} en el ranking`);
    if (comisionTexto) lineas.push(`💹 Comisiones generadas: ${comisionTexto}`);

    await crearAlerta(supabase, p.id, "Tu resumen semanal 🏆", {
      mensaje: lineas.join("\n"),
      link: "/panel/mi-espacio?tab=mis-ventas",
      tipo: "mi_resumen_semanal",
      prioridad: "novedad",
      modulo: "mi_espacio",
      categoriaNotif: "logros",
    });
    enviados++;
  }

  return Response.json({ ok: true, enviados });
}
