import CotizadorForm from "@/components/forms/CotizadorForm";
import { createClient } from "@/lib/supabase2/server";

export const metadata = {
  title: "Cotizá tu vehículo | Pfaffen Autos",
  description: "Dejanos los datos de tu vehículo y te garantizamos la venta en tiempo récord o cotizá online.",
};

// ?permuta=<vehiculoId> desde el botón "¿Tenés un usado para entregar?" del
// detalle de un auto — buscamos los datos frescos en la DB en vez de confiar
// en marca/modelo/precio por query param (evita que alguien arme un link con
// datos falsos para el vendedor).
export default async function CotizadorPage({
  searchParams,
}: {
  searchParams: Promise<{ permuta?: string }>;
}) {
  const { permuta } = await searchParams;
  let vehiculoObjetivo: { id: string; marca: string; modelo: string; precio: number; moneda: "ARS" | "USD" } | undefined;

  if (permuta) {
    const supabase = await createClient();
    const { data: vehiculo } = await supabase
      .from("vehiculos")
      .select("id, marca, modelo, precio_publicado_ars, precio_publicado_usd")
      .eq("id", permuta)
      .in("estado", ["disponible", "reservado"])
      .maybeSingle();

    if (vehiculo) {
      const usaUsd = vehiculo.precio_publicado_usd && !vehiculo.precio_publicado_ars;
      vehiculoObjetivo = {
        id: vehiculo.id,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        precio: usaUsd ? vehiculo.precio_publicado_usd : vehiculo.precio_publicado_ars,
        moneda: usaUsd ? "USD" : "ARS",
      };
    }
  }

  return <CotizadorForm vehiculoObjetivo={vehiculoObjetivo} />;
}