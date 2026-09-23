import { createClient } from "@supabase/supabase-js";
import { obtenerDolarBlue } from "@/lib/dolarBlue";

// Server-only (usa la service role key) -- a diferencia de dolarBlue.ts,
// que es puro fetch a una API externa y por eso es seguro importarlo desde
// un componente cliente (SolicitarFinanciacionForm.tsx lo hace). Este
// archivo NUNCA se debe importar desde un "use client".
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

// Si está activado el precio manual (Financiaciones → Configuración), se usa
// ese en vez del dólar blue automático -- en toda la app: catálogo público,
// simuladores de financiación y el ticker del panel, todos pasan por acá.
export async function obtenerCotizacionDolar(): Promise<{ compra: number; venta: number; manual: boolean }> {
  const { data } = await supabase
    .from("configuracion_empresa")
    .select("dolar_manual_activo, dolar_manual_compra, dolar_manual_venta")
    .eq("id", true)
    .maybeSingle();

  if (data?.dolar_manual_activo && data.dolar_manual_compra && data.dolar_manual_venta) {
    return { compra: Number(data.dolar_manual_compra), venta: Number(data.dolar_manual_venta), manual: true };
  }

  const { compra, venta } = await obtenerDolarBlue();
  return { compra, venta, manual: false };
}
