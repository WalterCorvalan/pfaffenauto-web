import { createClient } from "@/lib/supabase2/server";
import StockClient from "./StockClient";

export default async function StockPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: vehiculos }, { data: mandatos }, { data: perfiles }, { data: clientes }, { data: catalogoConfig }, { data: sucursales }, { data: config }] = await Promise.all([
    supabase.from("vehiculos").select("*, sucursal:sucursal_id ( nombre )").order("created_at", { ascending: false }),
    supabase.from("mandatos").select("*").order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, roles").eq("activo", true).order("nombre"),
    supabase.from("clientes").select("id, nombre, telefono, dni_cuit").order("nombre"),
    supabase.from("catalogo_config").select("*").eq("id", "default").single(),
    supabase.from("sucursales").select("id, nombre").order("nombre"),
    supabase.from("configuracion_empresa").select("stock_dias_estancado").eq("id", true).maybeSingle(),
  ]);

  return (
    <StockClient
      vehiculosIniciales={vehiculos || []}
      mandatosIniciales={mandatos || []}
      perfiles={perfiles || []}
      clientes={clientes || []}
      catalogoConfigInicial={catalogoConfig}
      sucursales={sucursales || []}
      miId={user?.id || ""}
      diasEstancado={config?.stock_dias_estancado || 90}
    />
  );
}
