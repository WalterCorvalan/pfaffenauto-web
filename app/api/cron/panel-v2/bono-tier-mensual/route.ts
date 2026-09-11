import { createClient } from "@supabase/supabase-js";

// Corre 1 vez por día vía pg_cron, pero solo hace algo el día 1 de cada mes
// (liquida el bono retroactivo del MES ANTERIOR, ya cerrado). La función
// liquidar_bono_retroactivo_mes() existía en la base hacía rato pero nada la
// llamaba -- Mis Ventas mostraba "bono proyectado" que nunca se pagaba solo.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

function hoyArgentina(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const hoy = hoyArgentina();
  if (hoy.slice(8, 10) !== "01") return Response.json({ ok: true, motivo: "no_es_dia_1" });

  const [anio, mes] = hoy.split("-").map(Number);
  const mesAnterior = mes === 1 ? `${anio - 1}-12-01` : `${anio}-${String(mes - 1).padStart(2, "0")}-01`;

  const { data, error } = await supabase.rpc("liquidar_bono_retroactivo_mes", { p_mes: mesAnterior });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  return Response.json({ ok: true, mes: mesAnterior, bonos_liquidados: data ?? 0 });
}
