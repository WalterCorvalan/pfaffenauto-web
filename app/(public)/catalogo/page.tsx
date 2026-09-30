import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { CAMPOS_VEHICULO_PUBLICO } from "@/lib/vehiculos";
import CatalogoClient from "./CatalogoClient";
import { getBrandingSeo } from "@/lib/brandingSeo";

export async function generateMetadata(): Promise<Metadata> {
  const { nombre } = await getBrandingSeo();
  return {
    title: `Catálogo de Autos 0KM y Usados | ${nombre}`,
    description: `Explorá todo el stock de ${nombre}: 0KM y usados seleccionados, con filtros por marca, tipo, precio y financiación.`,
    alternates: { canonical: "https://www.pfaffencars.com/catalogo" },
  };
}

export const revalidate = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!,
);

const ITEMS_POR_PAGINA = 12;

// Primera tanda sin filtros, renderizada en el servidor -- así el HTML
// inicial (lo que ve un crawler que no ejecuta JS pesado) ya trae autos
// reales en vez de una grilla vacía. CatalogoClient sigue manejando
// filtros/paginación 100% en el cliente como antes; esto solo evita que la
// carga inicial dependa de JS.
export default async function CatalogoPage() {
  const { data, count } = await supabase
    .from("vehiculos")
    .select(CAMPOS_VEHICULO_PUBLICO, { count: "exact" })
    .in("estado", ["disponible", "reservado"])
    .order("created_at", { ascending: false })
    .range(0, ITEMS_POR_PAGINA - 1);

  return <CatalogoClient vehiculosIniciales={data ?? []} totalInicial={count ?? 0} />;
}
