import { createClient } from "@supabase/supabase-js";
import { registrarError } from "@/lib/panel/logger";

// Corre 1 vez por día vía pg_cron. Un cheque "a_cobrar" que llega a su fecha
// de cobro pasa solo de "pendiente" a "depositado" (no mueve plata real,
// mismo criterio que ChequesTab.tsx: solo "cobrado" genera un movimiento de
// caja, cuando alguien extrae el efectivo del banco -- eso sigue siendo una
// acción manual desde el panel, elige a qué cuenta entra la plata).

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
  const { data: vencidos, error } = await supabase
    .from("cheques")
    .select("id")
    .eq("tipo", "a_cobrar")
    .eq("estado", "pendiente")
    .lte("fecha_cobro", hoy);

  if (error) {
    registrarError("cron/cheques-depositar", error);
    return Response.json({ error: "No se pudo consultar los cheques." }, { status: 500 });
  }

  let depositados = 0;
  for (const c of vencidos ?? []) {
    const { error: errCambiar } = await supabase.rpc("cambiar_estado_cheque", { p_cheque_id: c.id, p_estado: "depositado" });
    if (errCambiar) {
      registrarError("cron/cheques-depositar:cambiar-estado", errCambiar, { chequeId: c.id });
      continue;
    }
    depositados++;
  }

  return Response.json({ ok: true, depositados });
}
