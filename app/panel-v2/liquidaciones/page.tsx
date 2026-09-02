import { createClient } from "@/lib/supabase2/server";
import LiquidacionesClient from "./LiquidacionesClient";

export const metadata = { title: "Liquidaciones | Pfaffen Autos" };

export default async function LiquidacionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const miPerfil = user ? await supabase.from("perfiles").select("id, nombre, roles, ganancias_ocultas").eq("id", user.id).single().then((r) => r.data) : null;
  const puedeVerLiquidacion = miPerfil?.roles?.some((r: string) => ["admin", "finanzas", "gestoria"].includes(r)) ?? false;
  const soyAdmin = miPerfil?.roles?.includes("admin") ?? false;
  const soyAdminOFinanzas = miPerfil?.roles?.some((r: string) => r === "admin" || r === "finanzas") ?? false;

  const [{ data: liquidaciones }, { data: vendedores }, { data: config }] = await Promise.all([
    supabase.from("liquidaciones_gestoria").select("*, expediente:expedientes(titulo_transferido_url), vendedor:perfiles!liquidaciones_gestoria_vendedor_interno_id_fkey(nombre)").order("created_at", { ascending: false }).limit(500),
    supabase.from("perfiles").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("configuracion_empresa").select("liquidaciones_comision_fija, liquidaciones_pct_gestora, liquidaciones_pct_agencia").eq("id", true).single(),
  ]);

  return (
    <LiquidacionesClient
      miId={user?.id || ""}
      miNombre={miPerfil?.nombre || ""}
      puedeVerLiquidacion={puedeVerLiquidacion}
      soyAdmin={soyAdmin}
      soyAdminOFinanzas={soyAdminOFinanzas}
      gananciasOcultas={miPerfil?.ganancias_ocultas ?? false}
      liquidacionesIniciales={liquidaciones || []}
      vendedores={vendedores || []}
      config={{ comisionFija: config?.liquidaciones_comision_fija ?? 40000, pctGestora: config?.liquidaciones_pct_gestora ?? 10, pctAgencia: config?.liquidaciones_pct_agencia ?? 90 }}
    />
  );
}
