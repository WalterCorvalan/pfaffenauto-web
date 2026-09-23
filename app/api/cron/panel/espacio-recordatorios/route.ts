import { createClient } from "@supabase/supabase-js";
import { crearAlerta } from "@/lib/panel/alertas";

// Corre 1 vez por día vía pg_cron (mismo patrón que
// app/api/cron/panel/eventos/route.ts). Cubre lo de "Mi Espacio" que se
// cargaba pero nunca avisaba nada, para que funcione como agenda personal
// real y no solo como planilla:
//   1) Calendario personal (espacio_eventos) -- respeta el "recordar antes"
//      que el usuario elige al cargar el evento.
//   2) Vencimientos de vehículos personales (espacio_autos_personales) --
//      lista libre por vehículo (VTV, seguro, matrícula, lo que sea),
//      avisa 7 días antes.
//   3) Tareas personales (espacio_pendientes) con fecha de vencimiento.
//   4) Cuotas a cobrar / a pagar (espacio_cuotas_cobrar/pagar) -- avisa
//      unos días antes del vencimiento, una sola vez por cuota.
//   5) Gastos fijos (espacio_gastos_fijos) -- recordatorio recurrente el
//      "día del mes" cargado (alquiler, suscripciones...), una vez por mes.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

const DIAS_ANTES: Record<string, number> = {
  "El mismo día": 0,
  "1 día antes": 1,
  "3 días antes": 3,
  "1 semana antes": 7,
};

const DIAS_AVISO_VENCIMIENTO = 7;
const DIAS_AVISO_CUOTA = 5;

function hoyArgentina(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" }); // YYYY-MM-DD
}

function sumarDias(fechaIso: string, dias: number): string {
  const d = new Date(`${fechaIso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

async function avisarCalendarioPersonal(hoy: string): Promise<number> {
  const { data: eventos } = await supabase
    .from("espacio_eventos")
    .select("id, perfil_id, evento, fecha, hora, categoria, notas, recordar_antes")
    .eq("recordatorio_enviado", false)
    .lte("fecha", sumarDias(hoy, 7)); // trae con margen, se filtra fino abajo

  let avisados = 0;
  for (const e of eventos ?? []) {
    const diasAntes = DIAS_ANTES[e.recordar_antes] ?? 1;
    const fechaAviso = sumarDias(e.fecha, -diasAntes);
    // Se avisa el día calculado o cualquier día posterior que no se haya
    // avisado todavía (por si el cron estuvo caído) -- nunca antes de tiempo.
    if (fechaAviso > hoy) continue;

    const fechaLegible = new Date(`${e.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" });
    const titulo = e.fecha === hoy ? `Hoy: ${e.evento}` : `${e.evento} — ${fechaLegible}${e.hora ? ` ${e.hora}` : ""}`;
    await crearAlerta(supabase, e.perfil_id, titulo, {
      mensaje: e.notas || undefined,
      link: "/panel/mi-espacio?tab=calendario",
      tipo: "espacio_evento_personal",
      prioridad: "baja",
      modulo: "mi_espacio",
    });
    await supabase.from("espacio_eventos").update({ recordatorio_enviado: true }).eq("id", e.id);
    avisados++;
  }
  return avisados;
}

// "Mis Vehículos" cubre cualquier tipo (auto, moto, lancha, camión,
// maquinaria...) -- los 3 campos fijos vence_vtv/vence_seguro/vence_patente
// solo tenían sentido para un auto. Ahora los vencimientos son una lista
// libre en JSONB ({label, fecha, avisado_fecha?}), un elemento por cada
// cosa que el usuario quiera controlar (VTV, Matrícula, Habilitación
// náutica, RTO, lo que sea). "avisado_fecha" vive DENTRO de cada item del
// array (no hay una columna por vencimiento posible) y se reescribe el
// array completo al avisar, para no volver a avisar la misma fecha dos veces.
async function avisarVencimientosAutos(hoy: string): Promise<number> {
  const limite = sumarDias(hoy, DIAS_AVISO_VENCIMIENTO);
  const { data: autos } = await supabase
    .from("espacio_autos_personales")
    .select("id, perfil_id, marca, modelo, patente, vencimientos");

  let avisados = 0;
  for (const a of autos ?? []) {
    const nombreAuto = [a.marca, a.modelo, a.patente ? `(${a.patente})` : null].filter(Boolean).join(" ");
    const lista: { label: string; fecha: string; avisado_fecha?: string }[] = Array.isArray(a.vencimientos) ? a.vencimientos : [];
    if (lista.length === 0) continue;

    let cambio = false;
    const listaActualizada = [];
    for (const v of lista) {
      if (!v.fecha || v.fecha > limite || v.avisado_fecha === v.fecha) { listaActualizada.push(v); continue; }

      const fechaLegible = new Date(`${v.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" });
      const vencido = v.fecha < hoy;
      const titulo = `${v.label} ${vencido ? "vencido" : "por vencer"}: ${nombreAuto} — ${fechaLegible}`;
      await crearAlerta(supabase, a.perfil_id, titulo, {
        link: "/panel/mi-espacio?tab=mis-autos",
        tipo: "espacio_auto_vencimiento",
        prioridad: vencido ? "media" : "baja",
        modulo: "mi_espacio",
      });
      avisados++;
      cambio = true;
      listaActualizada.push({ ...v, avisado_fecha: v.fecha });
    }

    if (cambio) await supabase.from("espacio_autos_personales").update({ vencimientos: listaActualizada }).eq("id", a.id);
  }
  return avisados;
}

async function avisarPendientesVencidos(hoy: string): Promise<number> {
  const { data: pendientes } = await supabase
    .from("espacio_pendientes")
    .select("id, perfil_id, titulo, prioridad, vencimiento, notas, completada, aviso_enviado")
    .eq("completada", false)
    .eq("aviso_enviado", false)
    .lte("vencimiento", hoy)
    .not("vencimiento", "is", null);

  let avisados = 0;
  for (const p of pendientes ?? []) {
    await crearAlerta(supabase, p.perfil_id, `Tarea vencida: ${p.titulo}`, {
      mensaje: p.notas || undefined,
      link: "/panel/mi-espacio?tab=pendientes",
      tipo: "espacio_pendiente_vencido",
      prioridad: p.prioridad === "Alta" ? "media" : "baja",
      modulo: "mi_espacio",
    });
    await supabase.from("espacio_pendientes").update({ aviso_enviado: true }).eq("id", p.id);
    avisados++;
  }
  return avisados;
}

async function avisarCuota(hoy: string, tabla: "espacio_cuotas_cobrar" | "espacio_cuotas_pagar", tab: "cuotas-cobrar" | "cuotas-pagar", campoEstado: "cobrada" | "pagada", verboVencido: string): Promise<number> {
  const limite = sumarDias(hoy, DIAS_AVISO_CUOTA);
  const { data: cuotas } = await supabase
    .from(tabla)
    .select(`id, perfil_id, concepto, monto, moneda, vencimiento, ${campoEstado}, aviso_enviado`)
    .eq(campoEstado, false)
    .eq("aviso_enviado", false)
    .lte("vencimiento", limite);

  let avisados = 0;
  for (const c of (cuotas ?? []) as any[]) {
    const fechaLegible = new Date(`${c.vencimiento}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" });
    const vencida = c.vencimiento < hoy;
    const titulo = `${c.concepto} ${vencida ? verboVencido : "por vencer"}: ${c.moneda === "USD" ? "USD" : "$"} ${Math.round(Number(c.monto)).toLocaleString("es-AR")} — ${fechaLegible}`;
    await crearAlerta(supabase, c.perfil_id, titulo, {
      link: `/panel/mi-espacio?tab=${tab}`,
      tipo: `espacio_${tab.replace("-", "_")}`,
      prioridad: vencida ? "media" : "baja",
      modulo: "mi_espacio",
    });
    await supabase.from(tabla).update({ aviso_enviado: true }).eq("id", c.id);
    avisados++;
  }
  return avisados;
}

// Recordatorio recurrente (no "vence una vez", se repite todos los meses)
// -- se controla con "ultimo_aviso_mes" en vez de un booleano, para que
// vuelva a avisar el mes que viene sin que el usuario tenga que reabrir nada.
async function avisarGastosFijos(hoy: string): Promise<number> {
  const diaHoy = Number(hoy.slice(8, 10));
  const mesActual = hoy.slice(0, 7);
  const { data: gastos } = await supabase
    .from("espacio_gastos_fijos")
    .select("id, perfil_id, concepto, monto, moneda, dia_del_mes, ultimo_aviso_mes")
    .eq("dia_del_mes", diaHoy)
    .neq("ultimo_aviso_mes", mesActual);

  let avisados = 0;
  for (const g of gastos ?? []) {
    await crearAlerta(supabase, g.perfil_id, `Vence hoy: ${g.concepto} — ${g.moneda === "USD" ? "USD" : "$"} ${Math.round(Number(g.monto)).toLocaleString("es-AR")}`, {
      link: "/panel/mi-espacio?tab=gastos-fijos",
      tipo: "espacio_gasto_fijo",
      prioridad: "baja",
      modulo: "mi_espacio",
    });
    await supabase.from("espacio_gastos_fijos").update({ ultimo_aviso_mes: mesActual }).eq("id", g.id);
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

  const hoy = hoyArgentina();
  const [calendario, vencimientos, pendientes, cuotasCobrar, cuotasPagar, gastosFijos] = await Promise.all([
    avisarCalendarioPersonal(hoy),
    avisarVencimientosAutos(hoy),
    avisarPendientesVencidos(hoy),
    avisarCuota(hoy, "espacio_cuotas_cobrar", "cuotas-cobrar", "cobrada", "vencida"),
    avisarCuota(hoy, "espacio_cuotas_pagar", "cuotas-pagar", "pagada", "vencida"),
    avisarGastosFijos(hoy),
  ]);

  return Response.json({ ok: true, calendario, vencimientos, pendientes, cuotasCobrar, cuotasPagar, gastosFijos });
}
