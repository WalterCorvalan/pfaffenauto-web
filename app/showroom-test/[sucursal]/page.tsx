import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ShowroomEntrada from "@/components/showroom/ShowroomEntrada";
import { vehiculoRealAShowroom } from "@/lib/showroom/mapear";
import { CAMPOS_VEHICULO_PUBLICO } from "@/lib/vehiculos";

// Mismas fotos de fachada real que usa /sucursales/[slug] — el showroom es
// de la sucursal física, no de una marca.
const FACHADA_POR_SUCURSAL: Record<string, string> = {
  "casa-central": "/VDM.jpeg",
  "don-torcuato": "/pana.jpg",
};

export default async function ShowroomTestPage({
  params,
}: {
  params: Promise<{ sucursal: string }>;
}) {
  const { sucursal } = await params;
  const fachadaSrc = FACHADA_POR_SUCURSAL[sucursal];
  if (!fachadaSrc) notFound();

  const supabase = await createClient();
  const { data: sucursalRow } = await supabase
    .from("sucursales")
    .select("id, nombre")
    .eq("slug", sucursal)
    .maybeSingle();
  if (!sucursalRow) notFound();

  const { data } = await supabase
    .from("vehiculos")
    .select(CAMPOS_VEHICULO_PUBLICO)
    .eq("sucursal_id", sucursalRow.id)
    .in("estado", ["Disponible", "Reservado"])
    .order("created_at", { ascending: false })
    .limit(20);

  const vehiculos = (data || []).map((v) => vehiculoRealAShowroom(v, v.marca));

  return <ShowroomEntrada sucursalNombre={sucursalRow.nombre} fachadaSrc={fachadaSrc} vehiculos={vehiculos} />;
}
