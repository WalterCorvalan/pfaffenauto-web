import { createClient } from "@supabase/supabase-js";

// Corre cada 10 minutos vía pg_cron. La función reasignar_leads_vencidos()
// ya existía en la base (lee lead_routing_activo/umbral_minutos/
// max_reasignaciones de configuracion_empresa) pero nada la llamaba -- el
// toggle en Configuración > Empresa no hacía nada de verdad.

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

  const { data, error } = await supabase.rpc("reasignar_leads_vencidos");
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true, reasignados: data ?? 0 });
}
