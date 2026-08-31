import type { Metadata } from "next";
import { createClient } from "@/lib/supabase2/server";
import CatalogoClient from "./CatalogoClient";

export const metadata: Metadata = {
  title: "Catálogo de Autos 0KM y Usados | Pfaffen Autos",
  description: "Explorá todo el stock de Pfaffen Autos: 0KM y usados seleccionados, con filtros por marca, tipo, precio y financiación.",
  alternates: { canonical: "https://pfaffenautos.com.ar/catalogo-v2" },
};

// Sin `revalidate`/ISR a propósito: esta página incrementa el contador de
// visitas del catálogo en cada render (RPC de abajo) — cachear la página
// haría que ese contador solo suba una vez por ventana de revalidación en
// vez de una vez por visitante real, rompiendo la métrica.
export default async function CatalogoV2Page() {
  const supabase = await createClient();

  const [{ data: vehiculos }, { data: config }] = await Promise.all([
    supabase.from("vehiculos").select("*").eq("estado", "disponible").order("created_at", { ascending: false }),
    supabase.from("catalogo_config").select("*").eq("id", "default").single(),
  ]);

  await supabase.rpc("incrementar_stat_catalogo", { campo: "visitas" });

  return <CatalogoClient vehiculos={vehiculos || []} mostrarPrecios={config?.mostrar_precios ?? true} />;
}
