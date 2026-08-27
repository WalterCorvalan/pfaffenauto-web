import { createClient } from "@/lib/supabase2/server";
import CatalogoClient from "./CatalogoClient";

export default async function CatalogoV2Page() {
  const supabase = await createClient();

  const [{ data: vehiculos }, { data: config }] = await Promise.all([
    supabase.from("vehiculos").select("*").eq("estado", "disponible").order("created_at", { ascending: false }),
    supabase.from("catalogo_config").select("*").eq("id", "default").single(),
  ]);

  await supabase.rpc("incrementar_stat_catalogo", { campo: "visitas" });

  return <CatalogoClient vehiculos={vehiculos || []} mostrarPrecios={config?.mostrar_precios ?? true} />;
}
