import { createClient } from "@supabase/supabase-js";
import { crearAlerta } from "@/lib/panelV2/alertas";
import { SECTOR_A_ROLES } from "@/lib/panelV2/calendarioSectores";

// Corre cada 5 min vía pg_cron (ver sql_panel_v2_calendario_notificacion_programada.sql).
// Manda el aviso de un evento del calendario recién cuando llega su
// fecha/hora -- crear el evento no notifica nada (se probó y estaba mal:
// avisaba al toque de crearlo, no el día del evento).

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const ahora = new Date();
  const hoyIso = ahora.toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" }); // YYYY-MM-DD
  const horaActual = ahora.toLocaleTimeString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", hour12: false });

  // Vencidos: cualquier fecha anterior a hoy que por algún motivo no se avisó
  // (server caído, etc) + los de hoy cuya hora ya llegó + los de día entero
  // (hora null) de hoy, que se avisan apenas empieza el día.
  const { data: pendientes } = await supabase
    .from("eventos_calendario")
    .select("id, titulo, fecha, hora, descripcion, responsable_id, notificar_por, sectores, personas_notificadas")
    .eq("notificado", false)
    .lte("fecha", hoyIso);

  if (!pendientes || pendientes.length === 0) return Response.json({ ok: true, avisados: 0 });

  const debeAvisarseYa = (e: any) => {
    if (e.fecha < hoyIso) return true; // atrasado, avisar apenas corra el cron
    if (!e.hora) return true; // día entero, sin hora puntual
    return e.hora <= horaActual;
  };

  const aProcesar = pendientes.filter(debeAvisarseYa);
  if (aProcesar.length === 0) return Response.json({ ok: true, avisados: 0 });

  const { data: perfiles } = await supabase.from("perfiles").select("id, roles").eq("activo", true);

  let avisados = 0;
  for (const e of aProcesar) {
    const fechaLegible = new Date(`${e.fecha}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC" });
    const titulo = `Evento hoy: ${e.titulo}${e.hora ? ` — ${fechaLegible} ${e.hora}` : ` — ${fechaLegible}`}`;
    const link = "/panel/calendario";
    const destinatarios = new Set<string>();

    if (e.responsable_id) destinatarios.add(e.responsable_id);

    if (e.notificar_por === "personas" && Array.isArray(e.personas_notificadas)) {
      e.personas_notificadas.forEach((id: string) => destinatarios.add(id));
    } else if (e.notificar_por === "sector" && Array.isArray(e.sectores) && e.sectores.length > 0) {
      const rolesBuscados = e.sectores.flatMap((s: string) => SECTOR_A_ROLES[s] || []);
      if (rolesBuscados.length > 0) {
        (perfiles || []).forEach((p: any) => {
          if (p.roles?.some((r: string) => rolesBuscados.includes(r))) destinatarios.add(p.id);
        });
      }
    }

    await Promise.all(
      Array.from(destinatarios).map((destinatarioId) =>
        crearAlerta(supabase, destinatarioId, titulo, { mensaje: e.descripcion || undefined, link, tipo: "evento_calendario", prioridad: "media" })
      )
    );

    await supabase.from("eventos_calendario").update({ notificado: true, notificado_en: new Date().toISOString() }).eq("id", e.id);
    avisados++;
  }

  return Response.json({ ok: true, avisados });
}
