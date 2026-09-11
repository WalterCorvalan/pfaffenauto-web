import { createClient } from "@supabase/supabase-js";
import { crearAlerta } from "@/lib/panel/alertas";

// Corre 1 vez por día vía pg_cron (mismo patrón que
// app/api/cron/panel-v2/eventos/route.ts). Cubre dos cosas de "Mi Espacio"
// que se cargaban pero nunca avisaban nada:
//   1) Calendario personal (espacio_eventos) -- respeta el "recordar antes"
//      que el usuario elige al cargar el evento.
//   2) Vencimientos de autos personales (espacio_autos_personales) -- VTV,
//      seguro y patente, avisa 7 días antes.

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

async function avisarVencimientosAutos(hoy: string): Promise<number> {
  const limite = sumarDias(hoy, DIAS_AVISO_VENCIMIENTO);
  const { data: autos } = await supabase
    .from("espacio_autos_personales")
    .select("id, perfil_id, marca, modelo, patente, vence_vtv, vence_seguro, vence_patente, vtv_avisado_fecha, seguro_avisado_fecha, patente_avisado_fecha");

  let avisados = 0;
  const CAMPOS: { vence: "vence_vtv" | "vence_seguro" | "vence_patente"; avisado: "vtv_avisado_fecha" | "seguro_avisado_fecha" | "patente_avisado_fecha"; label: string }[] = [
    { vence: "vence_vtv", avisado: "vtv_avisado_fecha", label: "VTV" },
    { vence: "vence_seguro", avisado: "seguro_avisado_fecha", label: "Seguro" },
    { vence: "vence_patente", avisado: "patente_avisado_fecha", label: "Cuota de patente" },
  ];

  for (const a of autos ?? []) {
    const nombreAuto = [a.marca, a.modelo, a.patente ? `(${a.patente})` : null].filter(Boolean).join(" ");
    for (const campo of CAMPOS) {
      const fechaVence = a[campo.vence] as string | null;
      if (!fechaVence) continue;
      if (fechaVence > limite) continue; // todavía falta más de una semana
      if (a[campo.avisado] === fechaVence) continue; // ya se avisó esta misma fecha

      const fechaLegible = new Date(`${fechaVence}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" });
      const vencido = fechaVence < hoy;
      const titulo = `${campo.label} ${vencido ? "vencida" : "por vencer"}: ${nombreAuto} — ${fechaLegible}`;
      await crearAlerta(supabase, a.perfil_id, titulo, {
        link: "/panel/mi-espacio?tab=mis-autos",
        tipo: "espacio_auto_vencimiento",
        prioridad: vencido ? "media" : "baja",
        modulo: "mi_espacio",
      });
      await supabase.from("espacio_autos_personales").update({ [campo.avisado]: fechaVence }).eq("id", a.id);
      avisados++;
    }
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
  const [calendario, vencimientos] = await Promise.all([avisarCalendarioPersonal(hoy), avisarVencimientosAutos(hoy)]);

  return Response.json({ ok: true, calendario, vencimientos });
}
