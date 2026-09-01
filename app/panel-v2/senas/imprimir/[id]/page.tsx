import { createClient } from "@/lib/supabase2/server";
import { notFound } from "next/navigation";
import ImprimirSena from "./ImprimirSena";

export default async function ImprimirSenaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sena } = await supabase
    .from("senas")
    .select("*, perfiles:vendedor_id ( nombre ), sucursales:sucursal_id ( nombre ), permuta_vehiculo:permuta_vehiculo_id ( marca, modelo, patente )")
    .eq("id", id)
    .maybeSingle();

  if (!sena) notFound();

  return <ImprimirSena sena={sena} />;
}
