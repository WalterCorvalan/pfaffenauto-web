import { createClient } from "@supabase/supabase-js";

// Cada respuesta de OpenRouter trae el costo real de esa llamada puntual
// (campo "cost", en USD). En vez de crear un gasto por cada llamada (cientos
// de entradas de centavos, ilegible), lo vamos acumulando en UN solo
// movimiento de caja por día — se actualiza cada vez que hay una llamada nueva.
const DESCRIPCION_GASTO_IA = "Uso de IA (OpenRouter)";

let supabaseAdmin: any = null;
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseAdmin;
}

export async function registrarCostoIA(costoUsd: number) {
  if (!costoUsd || costoUsd <= 0) return;
  try {
    const supabase = getSupabaseAdmin();
    const hoy = new Date().toISOString().split("T")[0];

    const { data: existente } = await supabase
      .from("movimientos_caja")
      .select("id, monto")
      .eq("tipo", "egreso")
      .eq("descripcion", DESCRIPCION_GASTO_IA)
      .eq("fecha", hoy)
      .maybeSingle();

    if (existente) {
      await supabase
        .from("movimientos_caja")
        .update({ monto: Number(existente.monto) + costoUsd })
        .eq("id", existente.id as string);
    } else {
      await supabase.from("movimientos_caja").insert({
        tipo: "egreso",
        monto: costoUsd,
        descripcion: DESCRIPCION_GASTO_IA,
        fecha: hoy,
        forma_pago: "Tarjeta",
      });
    }
  } catch (err) {
    console.error("[costoTracker] no se pudo registrar el gasto de IA:", err);
  }
}
