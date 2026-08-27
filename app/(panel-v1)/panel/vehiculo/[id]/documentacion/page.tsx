import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import DocumentacionVehiculoClient from "./DocumentacionVehiculoClient";

// Checklist fijo del legajo (spec de Gestoría) — se siembra una sola vez por
// vehículo, la primera vez que alguien entra a esta pantalla.
const CHECKLIST_BASE = [
  "Formulario 08 firmado en blanco",
  "Verificación policial",
  "Informe de dominio",
  "Informe de infracciones",
  "Patentes al día",
  "VTV al día",
  "Manual",
  "Copia de llave",
  "Cédulas, título y demás documentos",
];

export default async function DocumentacionVehiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: vehiculo } = await supabase
    .from("vehiculos")
    .select("id, patente, marca, modelo, anio, origen, sucursales:sucursal_id(nombre)")
    .eq("id", id)
    .maybeSingle();

  if (!vehiculo) notFound();

  // upsert + ignoreDuplicates (no "if empty then insert"): dos requests a la
  // vez (prefetch + navegación real, típico en Next.js) no duplican el
  // checklist — el constraint único (vehiculo_id, tipo_documento) gana la carrera.
  await supabase
    .from("documentacion_vehiculos")
    .upsert(
      CHECKLIST_BASE.map((tipo_documento) => ({ vehiculo_id: id, tipo_documento })),
      { onConflict: "vehiculo_id,tipo_documento", ignoreDuplicates: true }
    );

  const { data: documentos } = await supabase
    .from("documentacion_vehiculos")
    .select("id, tipo_documento, estado, fecha_recibido, vencimiento, observacion, created_at, documentacion_vehiculos_archivos(id, url, nombre_archivo, created_at)")
    .eq("vehiculo_id", id)
    .order("created_at", { ascending: true });

  return <DocumentacionVehiculoClient vehiculo={vehiculo as any} documentosIniciales={documentos as any} />;
}
